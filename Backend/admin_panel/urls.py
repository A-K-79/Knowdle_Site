from django.urls import path
from .views import dashboard_view, delete_post_view, list_users_view, deactivate_user_view, delete_user_view

urlpatterns = [
    path("dashboard/", dashboard_view, name="dashboard"),
    path("delete-post/<int:post_id>/", delete_post_view, name="delete_post"),
    path("users/", list_users_view, name="list_users"),
    path("users/<int:user_id>/deactivate/", deactivate_user_view, name="deactivate_user"),
    path("users/<int:user_id>/delete/", delete_user_view, name="delete_user"),
]