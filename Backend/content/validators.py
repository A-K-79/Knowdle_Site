import os
from rest_framework.exceptions import ValidationError

ALLOWED_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"]
ALLOWED_VIDEO_EXTENSIONS = [".mp4", ".mov", ".avi"]

MAX_IMAGE_SIZE_MB = 10
MAX_VIDEO_SIZE_MB = 20


def validate_media(file, media_type):

    if not file:
        return

    ext = os.path.splitext(file.name)[1].lower()

    # -------------------------
    # IMAGE VALIDATION
    # -------------------------
    if media_type == "IMAGE":

        if ext not in ALLOWED_IMAGE_EXTENSIONS:
            raise ValidationError(
                "Only image files allowed (jpg, jpeg, png, webp)"
            )

        if file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024:
            raise ValidationError(
                "Image must be under 10MB"
            )

    # -------------------------
    # VIDEO VALIDATION
    # -------------------------
    elif media_type == "VIDEO":

        if ext not in ALLOWED_VIDEO_EXTENSIONS:
            raise ValidationError(
                "Only video files allowed (mp4, mov, avi)"
            )

        if file.size > MAX_VIDEO_SIZE_MB * 1024 * 1024:
            raise ValidationError(
                "Video must be under 20MB"
            )