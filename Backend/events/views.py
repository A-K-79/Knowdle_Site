from rest_framework import viewsets, permissions, status
from rest_framework.response import Response

from .models import Event
from .serializers import EventSerializer

class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all().order_by("date")
    serializer_class = EventSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        # Restrict creation to admin/staff
        if not self.request.user.is_staff:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only admin users are allowed to create events.")
        serializer.save(organizer=self.request.user)
