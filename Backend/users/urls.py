from django.urls import path
from . import views
from .views import get_profile
from .views import update_profile

urlpatterns = [
    path("", get_profile, name="get_profile"),
    path("update/", update_profile,name="update_profile"),
    path("notifications/", views.get_notifications),
    path("notifications/unread-count/", views.unread_count),
    path("notifications/<int:pk>/read/", views.mark_read),
    path("notifications/read-all/", views.mark_all_read),
    path("notifications/clear-all/", views.clear_all_notifications),
]