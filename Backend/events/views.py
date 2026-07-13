from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied

from .models import Event
from .serializers import EventSerializer

class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all().order_by("date")
    serializer_class = EventSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        # Restrict creation to admin/staff
        if not self.request.user.is_staff:
            raise PermissionDenied("Only admin users are allowed to create events.")
        serializer.save(organizer=self.request.user)

    def perform_destroy(self, instance):
        # Restrict deletion to admin/staff
        if not self.request.user.is_staff:
            raise PermissionDenied("Only admin users are allowed to delete events.")
        instance.delete()
