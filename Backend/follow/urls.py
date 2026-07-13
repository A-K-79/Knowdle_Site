from django.urls import path
from . import views

urlpatterns = [
    path("requests/", views.list_pending_requests),
    path("requests/<int:pk>/accept/", views.accept_follow_request),
    path("requests/<int:pk>/reject/", views.reject_follow_request),
    path("status/<str:username>/", views.follow_status),
    path("followers-list/<str:username>/", views.followers_list),
    path("following-list/<str:username>/", views.following_list),
    path("followers/<str:username>/", views.followers_count),
    path("following/<str:username>/", views.following_count),
    path("<str:username>/", views.follow_user),
    path("unfollow/<str:username>/", views.unfollow_user),
]