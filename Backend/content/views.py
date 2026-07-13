from rest_framework import generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly

from .models import Content, Like, Comment, SavedPost
from .serializers import ContentSerializer
from .permissions import IsOwnerOrReadOnly
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Q
from teams.models import TeamType



# -------------------------
# POSTS
# -------------------------
class ContentListCreateView(generics.ListCreateAPIView):
    queryset = Content.objects.all().order_by("-created_at")
    serializer_class = ContentSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class ContentDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Content.objects.all()
    serializer_class = ContentSerializer
    permission_classes = [IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]


# -------------------------
# FEED
# -------------------------
class FeedView(generics.ListAPIView):
    serializer_class = ContentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        
        # Check if we are listing posts for a specific team
        team_id = self.request.query_params.get("team_id")
        if team_id:
            # Only allow if user is a member of that team
            return Content.objects.filter(
                team_id=team_id,
                team__members=user,
                is_active=True
            ).order_by("-created_at")

        # Filter by category
        category = self.request.query_params.get("category", "all").lower()
        if category == "friends":
            # Followers-only posts (from followed users or self)
            return Content.objects.filter(
                Q(owner=user) | Q(owner__followers__follower=user),
                is_followers_only=True,
                team=None,
                is_active=True
            ).distinct().order_by("-created_at")
        elif category == "study":
            return Content.objects.filter(
                team__team_type=TeamType.STUDY,
                team__members=user,
                is_active=True
            ).order_by("-created_at")
        elif category == "professional":
            return Content.objects.filter(
                team__team_type=TeamType.PROFESSIONAL,
                team__members=user,
                is_active=True
            ).order_by("-created_at")
        else:
            # "all" category: Public posts + followers-only (private) posts from followed users + own private posts
            return Content.objects.filter(
                Q(team=None, is_followers_only=False) | # Public
                Q(team=None, is_followers_only=True, owner__followers__follower=user) | # Followed users' private posts
                Q(owner=user, is_followers_only=True), # My private posts
                is_active=True
            ).distinct().order_by("-created_at")

    filter_backends = [
        DjangoFilterBackend,
        SearchFilter,
        OrderingFilter,
    ]

    # Filter
    filterset_fields = [
        "media_type",
        "owner",
    ]

    # Search
    search_fields = [
        "caption",
    ]

    # Ordering
    ordering_fields = [
        "created_at",
    ]

# -------------------------
# LIKE
# -------------------------
class LikePostView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, post_id):
        like, created = Like.objects.get_or_create(
            user=request.user,
            post_id=post_id
        )

        if not created:
            like.delete()
            return Response({"message": "Unliked"})

        try:
            from users.models import Notification
            post = Content.objects.get(id=post_id)
            if post.owner != request.user:
                sender_name = getattr(request.user, 'profile', None).name if hasattr(request.user, 'profile') else request.user.username
                Notification.objects.create(
                    recipient=post.owner,
                    sender=request.user,
                    notification_type="LIKE",
                    text=f"{sender_name} liked your post",
                    target_id=post_id
                )
        except Exception as e:
            print("Like notification failed:", e)

        return Response({"message": "Liked"})


# -------------------------
# COMMENT
# -------------------------
class CommentView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, post_id):
        comments = Comment.objects.filter(post_id=post_id).order_by("-created_at")

        data = []

        for comment in comments:
            profile = getattr(comment.user, 'profile', None)
            data.append({
                "username": comment.user.username,
                "name": profile.name if profile else comment.user.username,
                "text": comment.text,
                "created_at": comment.created_at
            })

        return Response(data)

    def post(self, request, post_id):
        comment = Comment.objects.create(
            user=request.user,
            post_id=post_id,
            text=request.data["text"]
        )

        try:
            from users.models import Notification
            post = Content.objects.get(id=post_id)
            if post.owner != request.user:
                sender_name = getattr(request.user, 'profile', None).name if hasattr(request.user, 'profile') else request.user.username
                Notification.objects.create(
                    recipient=post.owner,
                    sender=request.user,
                    notification_type="COMMENT",
                    text=f"{sender_name} commented on your post: \"{comment.text[:30]}...\"",
                    target_id=post_id
                )
        except Exception as e:
            print("Comment notification failed:", e)

        return Response({"message": "Comment added"})

# -------------------------
# SAVE POST
# -------------------------
class SavePostView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, post_id):

        saved, created = SavedPost.objects.get_or_create(
            user=request.user,
            post_id=post_id
        )

        if not created:
            saved.delete()
            return Response({"message": "Removed from saved"})

        return Response({"message": "Saved"})


# -------------------------
# SAVED POSTS LIST
# -------------------------
class SavedPostsListView(generics.ListAPIView):
    serializer_class = ContentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        saved_ids = SavedPost.objects.filter(user=self.request.user).values_list("post_id", flat=True)
        return Content.objects.filter(id__in=saved_ids, is_active=True).order_by("-created_at")