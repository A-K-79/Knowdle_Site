from django.db import models
from django.contrib.auth.models import User

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)

    profile_picture = models.ImageField(
        upload_to='profile_pictures/',
        blank=True,
        null=True
    )

    name = models.CharField(max_length=100)
    bio = models.TextField(blank=True)
    department = models.CharField(max_length=100)
    skills = models.TextField(blank=True)

    def __str__(self):
        return self.name


class Notification(models.Model):
    NOTIFICATION_TYPES = [
        ("LIKE", "Like"),
        ("COMMENT", "Comment"),
        ("TEAM_INVITE", "Team Invite"),
        ("TEAM_JOIN_REQUEST", "Team Join Request"),
        ("FOLLOW_REQUEST", "Follow Request"),
        ("FOLLOW_ACCEPT", "Follow Accept"),
        ("EVENT_REMINDER", "Event Reminder"),
        ("CERTIFICATE_AWARDED", "Certificate Awarded")
    ]

    recipient = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="notifications"
    )
    sender = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="sent_notifications",
        null=True,
        blank=True
    )
    notification_type = models.CharField(
        max_length=25,
        choices=NOTIFICATION_TYPES
    )
    text = models.TextField()
    target_id = models.IntegerField(null=True, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.recipient.username} - {self.notification_type} - {self.is_read}"