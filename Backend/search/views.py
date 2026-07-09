from django.contrib.auth.models import User

from rest_framework.generics import ListAPIView
from rest_framework.permissions import IsAuthenticated

from users.models import Profile
from content.models import Content
from content.serializers import ContentSerializer


# -------------------------
# SEARCH USERS
# -------------------------
class SearchUsersView(ListAPIView):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        query = self.request.GET.get("search", "")
        return Profile.objects.filter(
            user__username__icontains=query
        )

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()

        data = [
            {
                "id": profile.user.id,
                "username": profile.user.username,
                "name": profile.name,
                "bio": profile.bio,
                "department": profile.department,
                "skills": profile.skills,
                "profile_picture": (
                    profile.profile_picture.url
                    if profile.profile_picture else None
                ),
            }
            for profile in queryset
        ]

        from rest_framework.response import Response
        return Response(data)


# -------------------------
# SEARCH POSTS
# -------------------------
class SearchPostsView(ListAPIView):
    serializer_class = ContentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        query = self.request.GET.get("search", "")
        return Content.objects.filter(
            caption__icontains=query,
            is_active=True
        )


# -------------------------
# SEARCH TOPICS
# -------------------------
class SearchTopicsView(ListAPIView):
    serializer_class = ContentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        query = self.request.GET.get("search", "")
        return Content.objects.filter(
            caption__icontains=f"#{query}",
            is_active=True
        )