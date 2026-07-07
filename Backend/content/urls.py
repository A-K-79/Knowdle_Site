from django.urls import path
from .views import (
    ContentListCreateView,
    ContentDetailView,
    FeedView,
    LikePostView,
    CommentView,
    SavePostView,
)

urlpatterns = [
    path("posts/", ContentListCreateView.as_view(), name="posts"),
    path("posts/<int:pk>/", ContentDetailView.as_view(), name="post-detail"),

    path("feed/", FeedView.as_view(), name="feed"),

    path("posts/<int:post_id>/like/", LikePostView.as_view(), name="like-post"),
    path("posts/<int:post_id>/comment/", CommentView.as_view(), name="comment-post"),
    path("posts/<int:post_id>/save/", SavePostView.as_view(), name="save-post"),
]