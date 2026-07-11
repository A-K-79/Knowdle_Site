from django.db import models
from django.contrib.auth.models import User

class EventType(models.TextChoices):
    HACKATHON = 'HACKATHON', 'Hackathon'
    WORKSHOP = 'WORKSHOP', 'Workshop'
    PLACEMENT = 'PLACEMENT', 'Placement Drive'

class Event(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField()
    event_type = models.CharField(
        max_length=20,
        choices=EventType.choices,
        default=EventType.WORKSHOP
    )
    date = models.DateTimeField()
    location = models.CharField(max_length=255)
    organizer = models.ForeignKey(User, on_delete=models.CASCADE, related_name="organized_events")
    registration_deadline = models.DateTimeField()
    max_participants = models.IntegerField(null=True, blank=True)
    banner = models.ImageField(upload_to="event_banners/", null=True, blank=True)
    
    # External registration details
    registration_link = models.URLField(max_length=500, null=True, blank=True)
    registration_details = models.TextField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title
