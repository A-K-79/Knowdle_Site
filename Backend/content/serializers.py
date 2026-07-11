from rest_framework import serializers
from .models import Content, Like, SavedPost
import os


class ContentSerializer(serializers.ModelSerializer):

    likes_count = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()
    owner_username = serializers.CharField(source='owner.username', read_only=True)
    owner_name = serializers.CharField(source='owner.profile.name', read_only=True)
    owner_profile_picture = serializers.SerializerMethodField()
    liked_by_user = serializers.SerializerMethodField()
    saved_by_user = serializers.SerializerMethodField()
    team_name = serializers.CharField(source="team.name", read_only=True)
    team_type = serializers.CharField(source="team.team_type", read_only=True)
    team_owner_username = serializers.SerializerMethodField()

    class Meta:
        model = Content
        fields = "__all__"
        read_only_fields = ["owner", "is_active"]

    def get_team_owner_username(self, obj):
        if obj.team:
            return obj.team.owner.username
        return None

    def get_likes_count(self, obj):
        return obj.like_set.count()

    def get_comments_count(self, obj):
        return obj.comment_set.count()

    def get_owner_profile_picture(self, obj):
        try:
            profile = obj.owner.profile
            return profile.profile_picture.url if profile.profile_picture else None
        except Exception:
            return None

    def get_liked_by_user(self, obj):
        request = self.context.get("request")
        if request and request.user and request.user.is_authenticated:
            return Like.objects.filter(user=request.user, post=obj).exists()
        return False

    def get_saved_by_user(self, obj):
        request = self.context.get("request")
        if request and request.user and request.user.is_authenticated:
            return SavedPost.objects.filter(user=request.user, post=obj).exists()
        return False


    def validate(self, data):

        caption = data.get("caption")
        media_file = data.get("media_file")
        media_type = data.get("media_type")

        if not caption and not media_file:
            raise serializers.ValidationError(
                "A post must contain either a caption or a media file."
            )

        team = data.get("team")
        if team:
            request = self.context.get("request")
            if request and request.user and request.user.is_authenticated:
                if not team.members.filter(id=request.user.id).exists():
                    raise serializers.ValidationError(
                        "You must be a member of the team to post in it."
                    )

        if media_file:
            extension = os.path.splitext(media_file.name)[1].lower()

            image_extensions = [".jpg", ".jpeg", ".png", ".webp"]
            video_extensions = [".mp4", ".mov", ".avi", ".mkv"]

            if media_type == "IMAGE" and extension not in image_extensions:
                raise serializers.ValidationError("Only image files are allowed.")

            if media_type == "VIDEO" and extension not in video_extensions:
                raise serializers.ValidationError("Only video files are allowed.")

            if media_file.size > 3 * 1024 * 1024 * 1024:
                raise serializers.ValidationError("Maximum upload size is 3 GB.")

        return data