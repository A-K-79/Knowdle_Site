# from rest_framework.decorators import api_view
# from rest_framework.response import Response
# from rest_framework import status

# from .models import Profile
# from .serializers import ProfileSerializer


# @api_view(['GET', 'PUT'])
# def profile(request):
#     profile = Profile.objects.first()   # Later: request.user.profile

#     if request.method == 'GET':
#         serializer = ProfileSerializer(profile)
#         return Response(serializer.data)

#     serializer = ProfileSerializer(
#         profile,
#         data=request.data,
#         partial=True
#     )

#     if serializer.is_valid():
#         serializer.save()
#         return Response(serializer.data)

#     return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Profile
from .serializers import ProfileSerializer

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_profile(request):
    username = request.query_params.get("username")
    if username:
        try:
            profile = Profile.objects.get(user__username=username)
        except Profile.DoesNotExist:
            return Response({"error": "Profile not found"}, status=404)
    else:
        profile = Profile.objects.get(user=request.user)
    
    serializer = ProfileSerializer(profile)
    return Response(serializer.data)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_profile(request):
    profile = Profile.objects.get(user=request.user)

    if request.data.get("remove_picture") == "true":
        if profile.profile_picture:
            profile.profile_picture.delete(save=False)
            profile.profile_picture = None
            profile.save()
        serializer = ProfileSerializer(profile)
        return Response(serializer.data)

    serializer = ProfileSerializer(profile, data=request.data, partial=True)

    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)

    return Response(serializer.errors, status=400)


from .models import Notification
from .serializers import NotificationSerializer

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_notifications(request):
    notifications = Notification.objects.filter(recipient=request.user).order_by("-created_at")[:50]
    serializer = NotificationSerializer(notifications, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def unread_count(request):
    count = Notification.objects.filter(recipient=request.user, is_read=False).count()
    return Response({"unread_count": count})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_read(request, pk):
    try:
        notification = Notification.objects.get(id=pk, recipient=request.user)
        notification.is_read = True
        notification.save()
        return Response({"message": "Notification marked as read"})
    except Notification.DoesNotExist:
        return Response({"error": "Notification not found"}, status=404)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_all_read(request):
    Notification.objects.filter(recipient=request.user, is_read=False).update(is_read=True)
    return Response({"message": "All notifications marked as read"})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def clear_all_notifications(request):
    Notification.objects.filter(recipient=request.user).delete()
    return Response({"message": "All notifications cleared"})