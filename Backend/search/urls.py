from django.urls import path
from .views import (
    SearchUsersView,
    SearchPostsView,
    SearchTopicsView,
    UnifiedSearchView,
)

urlpatterns = [
    path("", UnifiedSearchView.as_view(), name="unified-search"),
    path("users/", SearchUsersView.as_view(), name="search-users"),
    path("posts/", SearchPostsView.as_view(), name="search-posts"),
    path("topics/", SearchTopicsView.as_view(), name="search-topics"),
]