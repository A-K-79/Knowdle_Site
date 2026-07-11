from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TeamViewSet, TeamRequestsListView, AcceptRejectRequestView

router = DefaultRouter()
router.register(r"", TeamViewSet, basename="team")

urlpatterns = [
    path("requests/", TeamRequestsListView.as_view(), name="team-requests-list"),
    path("requests/<int:pk>/<str:action>/", AcceptRejectRequestView.as_view(), name="team-request-action"),
    path("", include(router.urls)),
]
