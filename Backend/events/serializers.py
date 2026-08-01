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

    def to_representation(self, instance):
        try:
            ret = super().to_representation(instance)
            if ret.get('banner'):
                from config.utils import clean_cloudinary_url
                ret['banner'] = clean_cloudinary_url(ret['banner'])
            return ret
        except Exception:
            ret = {}
            for field in self.fields:
                if field == 'banner':
                    try:
                        ret[field] = instance.banner.url if instance.banner else None
                    except Exception:
                        ret[field] = f"/media/{instance.banner.name}" if instance.banner and instance.banner.name else None
                else:
                    try:
                        ret[field] = self.fields[field].to_representation(getattr(instance, field))
                    except Exception:
                        ret[field] = None
            if ret.get('banner'):
                from config.utils import clean_cloudinary_url
                ret['banner'] = clean_cloudinary_url(ret['banner'])
            return ret
