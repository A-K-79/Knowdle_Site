from django.db import models
from django.contrib.auth.models import User


class TeamType(models.TextChoices):
    FRIENDS = "FRIENDS", "Friends"
    STUDY = "STUDY", "Study"
    PROFESSIONAL = "PROFESSIONAL", "Professional"


class RequestType(models.TextChoices):
    INVITATION = "INVITATION", "Invitation"
    JOIN_REQUEST = "JOIN_REQUEST", "Join Request"


class RequestStatus(models.TextChoices):
    PENDING = "PENDING", "Pending"
    ACCEPTED = "ACCEPTED", "Accepted"
    REJECTED = "REJECTED", "Rejected"


class Team(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    team_type = models.CharField(
        max_length=20,
        choices=TeamType.choices,
        default=TeamType.STUDY
    )
    team_logo = models.ImageField(upload_to="team_logos/", blank=True, null=True)
    owner = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="owned_teams"
    )
    members = models.ManyToManyField(
        User,
        through="TeamMember",
        related_name="joined_teams"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.team_type})"


class TeamMember(models.Model):
    team = models.ForeignKey(
        Team,
        on_delete=models.CASCADE,
        related_name="memberships"
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="team_memberships"
    )
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("team", "user")

    def __str__(self):
        return f"{self.user.username} in {self.team.name}"


class TeamInvitation(models.Model):
    team = models.ForeignKey(
        Team,
        on_delete=models.CASCADE,
        related_name="invitations"
    )
    sender = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="sent_invitations"
    )
    receiver = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="received_invitations"
    )
    request_type = models.CharField(
        max_length=20,
        choices=RequestType.choices,
        default=RequestType.INVITATION
    )
    status = models.CharField(
        max_length=20,
        choices=RequestStatus.choices,
        default=RequestStatus.PENDING
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.request_type} - {self.team.name} ({self.status})"


class TeamMessage(models.Model):
    team = models.ForeignKey(
        Team,
        on_delete=models.CASCADE,
        related_name="messages"
    )
    sender = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="team_messages"
    )
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Message by {self.sender.username} in {self.team.name} at {self.created_at}"
