from rest_framework.permissions import BasePermission


class IsOwnerOrReadOnly(BasePermission):

    def has_object_permission(self, request, view, obj):

        # Everyone can read
        if request.method in ["GET", "HEAD", "OPTIONS"]:
            return True

        # Only owner (or team owner if it belongs to a team) can edit/delete
        if obj.owner == request.user:
            return True
            
        if obj.team and obj.team.owner == request.user:
            return True

        return False