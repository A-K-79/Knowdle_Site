from rest_framework import generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly

from .models import Content, Like, Comment, SavedPost
from .serializers import ContentSerializer
from .permissions import IsOwnerOrReadOnly
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter


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

    queryset = Content.objects.filter(
        is_active=True
    ).order_by("-created_at")

    serializer_class = ContentSerializer
    permission_classes = [IsAuthenticated]

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

        return Response({"message": "Liked"})


# -------------------------
# COMMENT
# -------------------------
class CommentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, post_id):

        Comment.objects.create(
            user=request.user,
            post_id=post_id,
            text=request.data["text"]
        )

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