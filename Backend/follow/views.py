from django.contrib.auth.models import User
from django.db.models import Q
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Follow, FollowRequest


def get_user_details(user):
    profile = getattr(user, 'profile', None)
    return {
        "id": user.id,
        "username": user.username,
        "name": profile.name if profile else "",
        "profile_picture": profile.profile_picture.url if profile and profile.profile_picture else None
    }


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def follow_user(request, username):
    try:
        target_user = User.objects.get(username=username)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)

    if request.user == target_user:
        return Response({"error": "You cannot connect with yourself"}, status=400)

    # Check if already following
    if Follow.objects.filter(follower=request.user, following=target_user).exists():
        return Response({"error": "You are already following this user"}, status=400)

    # Check if pending request exists
    existing_request = FollowRequest.objects.filter(
        sender=request.user,
        receiver=target_user,
        status="PENDING"
    ).exists()

    if existing_request:
        return Response({"error": "Follow request already pending"}, status=400)

    # Create FollowRequest
    FollowRequest.objects.create(
        sender=request.user,
        receiver=target_user,
        status="PENDING"
    )

    try:
        from users.models import Notification
        sender_name = getattr(request.user, 'profile', None).name if hasattr(request.user, 'profile') else request.user.username
        Notification.objects.create(
            recipient=target_user,
            sender=request.user,
            notification_type="FOLLOW_REQUEST",
            text=f"{sender_name} sent you a connection/follow request",
            target_id=request.user.id
        )
    except Exception as e:
        print("Follow request notification failed:", e)

    return Response({"message": "Follow request sent successfully"})


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def unfollow_user(request, username):
    try:
        target_user = User.objects.get(username=username)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)

    # Delete follows
    follow_deleted, _ = Follow.objects.filter(follower=request.user, following=target_user).delete()
    # Delete requests
    FollowRequest.objects.filter(
        Q(sender=request.user, receiver=target_user) |
        Q(sender=target_user, receiver=request.user)
    ).delete()

    if not follow_deleted:
        return Response({"message": "Unfollowed and cleared requests"})

    return Response({"message": f"You have unfollowed {username}"})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_pending_requests(request):
    requests = FollowRequest.objects.filter(receiver=request.user, status="PENDING").order_by("-created_at")
    data = []
    for req in requests:
        data.append({
            "id": req.id,
            "sender": get_user_details(req.sender),
            "created_at": req.created_at
        })
    return Response(data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def accept_follow_request(request, pk):
    try:
        follow_req = FollowRequest.objects.get(id=pk, receiver=request.user)
    except FollowRequest.DoesNotExist:
        return Response({"error": "Follow request not found"}, status=404)

    if follow_req.status != "PENDING":
        return Response({"error": "Request already processed"}, status=400)

    follow_req.status = "ACCEPTED"
    follow_req.save()

    # Create Follow entry
    Follow.objects.get_or_create(
        follower=follow_req.sender,
        following=follow_req.receiver
    )

    try:
        from users.models import Notification
        receiver_name = getattr(request.user, 'profile', None).name if hasattr(request.user, 'profile') else request.user.username
        Notification.objects.create(
            recipient=follow_req.sender,
            sender=request.user,
            notification_type="FOLLOW_ACCEPT",
            text=f"{receiver_name} accepted your connection/follow request",
            target_id=request.user.id
        )
    except Exception as e:
        print("Follow accept notification failed:", e)

    return Response({"message": f"Accepted follow request from {follow_req.sender.username}"})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def reject_follow_request(request, pk):
    try:
        follow_req = FollowRequest.objects.get(id=pk, receiver=request.user)
    except FollowRequest.DoesNotExist:
        return Response({"error": "Follow request not found"}, status=404)

    follow_req.delete()
    return Response({"message": "Follow request declined"})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def followers_list(request, username):
    try:
        target_user = User.objects.get(username=username)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)

    followers = Follow.objects.filter(following=target_user)
    data = [get_user_details(f.follower) for f in followers]
    return Response(data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def following_list(request, username):
    try:
        target_user = User.objects.get(username=username)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)

    following = Follow.objects.filter(follower=target_user)
    data = [get_user_details(f.following) for f in following]
    return Response(data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def follow_status(request, username):
    try:
        target_user = User.objects.get(username=username)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)

    is_following = Follow.objects.filter(follower=request.user, following=target_user).exists()
    pending_sent = FollowRequest.objects.filter(sender=request.user, receiver=target_user, status="PENDING").exists()
    pending_received = FollowRequest.objects.filter(sender=target_user, receiver=request.user, status="PENDING").exists()

    req = FollowRequest.objects.filter(
        Q(sender=request.user, receiver=target_user, status="PENDING") |
        Q(sender=target_user, receiver=request.user, status="PENDING")
    ).first()

    return Response({
        "is_following": is_following,
        "pending_sent": pending_sent,
        "pending_received": pending_received,
        "request_id": req.id if req else None
    })


# Keep count compatibility views
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def followers_count(request, username):
    try:
        target_user = User.objects.get(username=username)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)

    count = Follow.objects.filter(following=target_user).count()
    return Response({
        "username": username,
        "followers": count
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def following_count(request, username):
    try:
        target_user = User.objects.get(username=username)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)

    count = Follow.objects.filter(follower=target_user).count()
    return Response({
        "username": username,
        "following": count
    })