from django.contrib.auth.models import User
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Follow

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def follow_user(request, username):
    try:
        target_user = User.objects.get(username=username)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)

    if request.user == target_user:
        return Response({"error": "You cannot follow yourself"}, status=400)

    if Follow.objects.filter(follower=request.user, following=target_user).exists():
        return Response({"error": "Already following this user"}, status=400)

    Follow.objects.create(
        follower=request.user,
        following=target_user
    )

    return Response({"message": f"You are now following {username}"})


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def unfollow_user(request, username):
    try:
        target_user = User.objects.get(username=username)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)

    follow = Follow.objects.filter(
        follower=request.user,
        following=target_user
    )

    if not follow.exists():
        return Response({"error": "You are not following this user"}, status=400)

    follow.delete()

    return Response({"message": f"You have unfollowed {username}"})


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