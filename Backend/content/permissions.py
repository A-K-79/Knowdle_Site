from rest_framework.permissions import BasePermission


class IsOwnerOrReadOnly(BasePermission):

    def has_object_permission(self, request, view, obj):

        # Everyone can read
        if request.method in ["GET", "HEAD", "OPTIONS"]:
            return True

        # Only owner can edit/delete
        return obj.owner == request.user