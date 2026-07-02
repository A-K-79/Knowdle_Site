from django.urls import path
from . import views
from .views import get_profile
from .views import update_profile

urlpatterns = [
    path("", get_profile, name="get_profile"),
    path("update/", update_profile,name="update_profile"),
]