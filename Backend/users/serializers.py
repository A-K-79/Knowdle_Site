from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Profile, Notification

class ProfileSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    is_staff = serializers.BooleanField(source='user.is_staff', read_only=True)
    followers_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()
    following_list = serializers.SerializerMethodField()

    class Meta:
        model = Profile
        fields = [
            'id',
            'user_id',
            'username',
            'email',
            'is_staff',
            'profile_picture',
            'name',
            'bio',
            'department',
            'skills',
            'followers_count',
            'following_count',
            'following_list'
        ]

    def get_followers_count(self, obj):
        return obj.user.followers.count()

    def get_following_count(self, obj):
        return obj.user.following.count()

    def get_following_list(self, obj):
        return list(obj.user.following.values_list("following__username", flat=True))


class UserMinimalSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source="profile.name", read_only=True)
    profile_picture = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "name", "profile_picture"]

    def get_profile_picture(self, obj):
        try:
            profile = obj.profile
            if profile.profile_picture:
                return profile.profile_picture.url
        except Exception:
            pass
        return None


class NotificationSerializer(serializers.ModelSerializer):
    sender_details = UserMinimalSerializer(source="sender", read_only=True)

    class Meta:
        model = Notification
        fields = [
            "id",
            "recipient",
            "sender",
            "sender_details",
            "notification_type",
            "text",
            "target_id",
            "is_read",
            "created_at"
        ]