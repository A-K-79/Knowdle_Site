from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from django.contrib.auth.models import User
from content.models import Content, Comment

@api_view(["GET"])
@permission_classes([IsAdminUser])
def dashboard_view(request):
    return Response({
        "total_users": User.objects.count(),
        "total_posts": Content.objects.count(),
        "total_comments": Comment.objects.count(),
    })

@api_view(["DELETE"])
@permission_classes([IsAdminUser])
def delete_post_view(request, post_id):
    try:
        post = Content.objects.get(id=post_id)
        post.delete()
        return Response({"message": "Post deleted"})
    except Content.DoesNotExist:
        return Response({"error": "Post not found"}, status=404)
    

@api_view(["GET"])
@permission_classes([IsAdminUser])
def list_users_view(request):
    users = User.objects.all().values("id", "username", "email", "is_active", "is_staff")
    return Response(list(users))

@api_view(["PATCH"])
@permission_classes([IsAdminUser])
def deactivate_user_view(request, user_id):
    try:
        user = User.objects.get(id=user_id)
        user.is_active = False
        user.save()
        return Response({"message": f"User {user.username} deactivated"})
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)

@api_view(["DELETE"])
@permission_classes([IsAdminUser])
def delete_user_view(request, user_id):
    try:
        user = User.objects.get(id=user_id)
        user.delete()
        return Response({"message": "User deleted"})
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)
