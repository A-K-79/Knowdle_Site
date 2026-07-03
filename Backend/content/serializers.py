from rest_framework import serializers
from .models import Content
import os


class ContentSerializer(serializers.ModelSerializer):

    class Meta:
        model = Content
        fields = "__all__"
        read_only_fields = ["owner"]   # <-- Add this line

    def validate(self, data):

        caption = data.get("caption")
        media_file = data.get("media_file")
        media_type = data.get("media_type")

        if not caption and not media_file:
            raise serializers.ValidationError(
                "A post must contain either a caption or a media file."
            )

        if media_file:
            extension = os.path.splitext(media_file.name)[1].lower()

            image_extensions = [".jpg", ".jpeg", ".png", ".webp"]
            video_extensions = [".mp4", ".mov", ".avi", ".mkv"]

            if media_type == "IMAGE" and extension not in image_extensions:
                raise serializers.ValidationError("Only image files are allowed.")

            if media_type == "VIDEO" and extension not in video_extensions:
                raise serializers.ValidationError("Only video files are allowed.")

            if media_file.size > 50 * 1024 * 1024:
                raise serializers.ValidationError("Maximum upload size is 50 MB.")

        return data