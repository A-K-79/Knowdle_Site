from django.urls import path
from . import views

urlpatterns = [
    path("<str:username>/", views.follow_user),
    path("unfollow/<str:username>/", views.unfollow_user),
    path("followers/<str:username>/", views.followers_count),
    path("following/<str:username>/", views.following_count),
]