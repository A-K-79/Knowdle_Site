from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Event

class EventSerializer(serializers.ModelSerializer):
    organizer_username = serializers.CharField(source='organizer.username', read_only=True)
    organizer_name = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = [
            'id', 'title', 'description', 'event_type', 'date', 'location',
            'organizer', 'organizer_username', 'organizer_name',
            'registration_deadline', 'max_participants', 'banner', 'created_at',
            'registration_link', 'registration_details'
        ]
        read_only_fields = ['organizer', 'created_at']

    def get_organizer_name(self, obj):
        profile = getattr(obj.organizer, 'profile', None)
        return profile.name if profile and profile.name else obj.organizer.username
