from django.shortcuts import get_object_or_404
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth.models import User
from django.db import IntegrityError

from .models import Team, TeamMember, TeamInvitation, RequestType, RequestStatus, TeamType, TeamMessage
from .serializers import TeamSerializer, TeamDetailSerializer, TeamInvitationSerializer, TeamMessageSerializer


class IsTeamOwnerOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.owner == request.user


class TeamViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, IsTeamOwnerOrReadOnly]

    def get_queryset(self):
        # List all teams the authenticated user belongs to
        return Team.objects.filter(members=self.request.user).order_by("-created_at")

    def get_serializer_class(self):
        if self.action in ["retrieve", "update", "partial_update"]:
            return TeamDetailSerializer
        return TeamSerializer

    def perform_create(self, serializer):
        # Save team owner
        team = serializer.save(owner=self.request.user)
        # Automatically add the owner as a member
        TeamMember.objects.create(team=team, user=self.request.user)

    @action(detail=True, methods=["post"])
    def leave(self, request, pk=None):
        team = self.get_object_or_404(pk)
        if team.owner == request.user:
            return Response(
                {"error": "Owners cannot leave the team. Delete the team or transfer ownership."},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            membership = TeamMember.objects.get(team=team, user=request.user)
            membership.delete()
            return Response({"message": "Successfully left the team."})
        except TeamMember.DoesNotExist:
            return Response({"error": "You are not a member of this team."}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["post"], url_path="join-request")
    def join_request(self, request, pk=None):
        team = self.get_object_or_404(pk)
        if team.members.filter(id=request.user.id).exists():
            return Response({"error": "You are already a member of this team."}, status=status.HTTP_400_BAD_REQUEST)

        # Check existing pending invitations or join requests
        existing = TeamInvitation.objects.filter(
            team=team,
            sender=request.user,
            request_type=RequestType.JOIN_REQUEST,
            status=RequestStatus.PENDING
        ).exists()

        if existing:
            return Response({"error": "You already have a pending join request."}, status=status.HTTP_400_BAD_REQUEST)

        inv = TeamInvitation.objects.create(
            team=team,
            sender=request.user,
            receiver=team.owner,
            request_type=RequestType.JOIN_REQUEST,
            status=RequestStatus.PENDING
        )

        try:
            from users.models import Notification
            sender_name = getattr(request.user, 'profile', None).name if hasattr(request.user, 'profile') else request.user.username
            Notification.objects.create(
                recipient=team.owner,
                sender=request.user,
                notification_type="TEAM_JOIN_REQUEST",
                text=f"{sender_name} requested to join your team \"{team.name}\"",
                target_id=team.id
            )
        except Exception as e:
            print("Team join request notification failed:", e)

        return Response(TeamInvitationSerializer(inv).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"])
    def invite(self, request, pk=None):
        team = self.get_object_or_404(pk)
        
        # Verify requester is a member of the team
        if not team.members.filter(id=request.user.id).exists():
            return Response({"error": "You must be a member to invite others."}, status=status.HTTP_403_FORBIDDEN)

        username = request.data.get("username", "").strip()
        if not username:
            return Response({"error": "Username is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            target_user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({"error": "User does not exist."}, status=status.HTTP_404_NOT_FOUND)

        if team.members.filter(id=target_user.id).exists():
            return Response({"error": "User is already a member."}, status=status.HTTP_400_BAD_REQUEST)

        existing = TeamInvitation.objects.filter(
            team=team,
            receiver=target_user,
            request_type=RequestType.INVITATION,
            status=RequestStatus.PENDING
        ).exists()

        if existing:
            return Response({"error": "An invitation is already pending for this user."}, status=status.HTTP_400_BAD_REQUEST)

        inv = TeamInvitation.objects.create(
            team=team,
            sender=request.user,
            receiver=target_user,
            request_type=RequestType.INVITATION,
            status=RequestStatus.PENDING
        )

        try:
            from users.models import Notification
            sender_name = getattr(request.user, 'profile', None).name if hasattr(request.user, 'profile') else request.user.username
            Notification.objects.create(
                recipient=target_user,
                sender=request.user,
                notification_type="TEAM_INVITE",
                text=f"{sender_name} invited you to join the team \"{team.name}\"",
                target_id=team.id
            )
        except Exception as e:
            print("Team invite notification failed:", e)

        return Response(TeamInvitationSerializer(inv).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="members/(?P<user_id>[^/.]+)/remove")
    def remove_member(self, request, pk=None, user_id=None):
        team = self.get_object_or_404(pk)
        if team.owner != request.user:
            return Response({"error": "Only team owners can remove members."}, status=status.HTTP_403_FORBIDDEN)

        try:
            target_user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"error": "User does not exist."}, status=status.HTTP_404_NOT_FOUND)

        if team.owner == target_user:
            return Response({"error": "Owners cannot be removed from their team."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            membership = TeamMember.objects.get(team=team, user=target_user)
            membership.delete()
            return Response({"message": f"Successfully removed {target_user.username}."})
        except TeamMember.DoesNotExist:
            return Response({"error": "User is not a member of this team."}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["get", "post"])
    def messages(self, request, pk=None):
        team = self.get_object_or_404(pk)
        
        # Verify requester is a member of the team
        if not team.members.filter(id=request.user.id).exists():
            return Response({"error": "You must be a member to access team chat."}, status=status.HTTP_403_FORBIDDEN)

        if request.method == "GET":
            msgs = team.messages.exclude(deleted_for_users=request.user).order_by("created_at")
            serializer = TeamMessageSerializer(msgs, many=True, context={"request": request})
            return Response(serializer.data)

        elif request.method == "POST":
            text = request.data.get("text", "").strip()
            if not text:
                return Response({"error": "Message text cannot be empty."}, status=status.HTTP_400_BAD_REQUEST)
                
            msg = TeamMessage.objects.create(
                team=team,
                sender=request.user,
                text=text
            )
            serializer = TeamMessageSerializer(msg, context={"request": request})
            return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="delete-message")
    def delete_message(self, request, pk=None):
        team = self.get_object_or_404(pk)
        message_id = request.data.get("message_id")
        delete_type = request.data.get("delete_type", "me")  # "everyone" or "me"
        
        try:
            msg = team.messages.get(id=message_id)
        except TeamMessage.DoesNotExist:
            return Response({"error": "Message not found in this team."}, status=status.HTTP_404_NOT_FOUND)
            
        # Verify user is a member
        if not team.members.filter(id=request.user.id).exists():
            return Response({"error": "You must be a member to delete messages."}, status=status.HTTP_403_FORBIDDEN)
            
        if delete_type == "me":
            # Add this user to deleted_for_users to hide it
            msg.deleted_for_users.add(request.user)
            return Response({"message": "Message deleted for me successfully."})
            
        elif delete_type == "everyone":
            # Verify 12-hour limit
            from django.utils import timezone
            time_difference = timezone.now() - msg.created_at
            if time_difference.total_seconds() > 12 * 3600:
                return Response({"error": "You can no longer delete this message for everyone. The 12-hour limit has passed."}, status=status.HTTP_400_BAD_REQUEST)
                
            # Verify authorization (sender or team owner)
            if msg.sender != request.user and team.owner != request.user:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("You are not authorized to delete this message.")
                
            msg.is_deleted = True
            msg.text = "This message was deleted"
            msg.save()
            return Response({"message": "Message deleted for everyone successfully."})
            
        return Response({"error": "Invalid delete type."}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["post"], url_path="ai-summary")
    def ai_summary(self, request, pk=None):
        import os
        team = self.get_object_or_404(pk)

        # Check if the user is a member of the team
        if not team.members.filter(id=request.user.id).exists():
            return Response({"error": "You must be a member of the team to generate summaries."}, status=status.HTTP_403_FORBIDDEN)

        # Collect latest 20 team posts
        from content.models import Content
        posts = Content.objects.filter(team=team, is_active=True).order_by("-created_at")[:20]

        if not posts.exists():
            return Response({"summary": "No posts found in this team yet to summarize."})

        # Combine posts into a single text block
        text_block = []
        for post in reversed(posts):
            author_name = getattr(post.owner, 'profile', None).name if hasattr(post.owner, 'profile') else post.owner.username
            post_text = f"[{post.created_at.strftime('%Y-%m-%d %H:%M')}] {author_name}: {post.caption or ''}"
            if post.media_file:
                post_text += f" (Attached file: {os.path.basename(post.media_file.name)})"
            text_block.append(post_text)

        combined_text = "\n".join(text_block)

        # Call the existing AI Summarizer with combined text and team type
        from ai.services import summarize_notes
        summary = summarize_notes(combined_text, team_type=team.team_type)

        return Response({"summary": summary})

    def get_object_or_404(self, pk):
        from django.shortcuts import get_object_or_404
        return get_object_or_404(Team, pk=pk)


class TeamRequestsListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # Received invitations (sent to user)
        invitations = TeamInvitation.objects.filter(
            receiver=request.user,
            request_type=RequestType.INVITATION,
            status=RequestStatus.PENDING
        ).order_by("-created_at")

        # Received join requests (sent to teams owned by user)
        join_requests = TeamInvitation.objects.filter(
            team__owner=request.user,
            request_type=RequestType.JOIN_REQUEST,
            status=RequestStatus.PENDING
        ).order_by("-created_at")

        return Response({
            "invitations": TeamInvitationSerializer(invitations, many=True, context={"request": request}).data,
            "join_requests": TeamInvitationSerializer(join_requests, many=True, context={"request": request}).data
        })


class AcceptRejectRequestView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk=None, action=None):
        from django.shortcuts import get_object_or_404
        invitation = get_object_or_404(TeamInvitation, pk=pk)

        # Permissions checks
        if invitation.request_type == RequestType.INVITATION:
            # User must be the invited receiver
            if invitation.receiver != request.user:
                return Response({"error": "Unauthorized action."}, status=status.HTTP_403_FORBIDDEN)
        else:
            # User must be the team owner to accept join request
            if invitation.team.owner != request.user:
                return Response({"error": "Unauthorized action."}, status=status.HTTP_403_FORBIDDEN)

        if invitation.status != RequestStatus.PENDING:
            return Response({"error": "This request has already been processed."}, status=status.HTTP_400_BAD_REQUEST)

        if action == "accept":
            invitation.status = RequestStatus.ACCEPTED
            invitation.save()

            # Add user to team memberships
            target_user = invitation.receiver if invitation.request_type == RequestType.INVITATION else invitation.sender
            
            # Avoid duplicate membership errors
            TeamMember.objects.get_or_create(team=invitation.team, user=target_user)

            # Proactively clear other pending requests between this user and team
            TeamInvitation.objects.filter(
                team=invitation.team,
                receiver=target_user,
                status=RequestStatus.PENDING
            ).exclude(id=invitation.id).update(status=RequestStatus.ACCEPTED)

            TeamInvitation.objects.filter(
                team=invitation.team,
                sender=target_user,
                status=RequestStatus.PENDING
            ).exclude(id=invitation.id).update(status=RequestStatus.ACCEPTED)

            return Response({"message": "Request accepted successfully."})

        elif action == "reject":
            invitation.status = RequestStatus.REJECTED
            invitation.save()
            return Response({"message": "Request rejected successfully."})

        return Response({"error": "Invalid action."}, status=status.HTTP_400_BAD_REQUEST)
