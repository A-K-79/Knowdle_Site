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