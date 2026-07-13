from rest_framework import serializers
from django.contrib.auth.models import User
from users.models import Profile
from .models import Team, TeamMember, TeamInvitation, TeamMessage


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
        except Profile.DoesNotExist:
            pass
        return None


class TeamSerializer(serializers.ModelSerializer):
    owner_details = UserMinimalSerializer(source="owner", read_only=True)
    members_count = serializers.SerializerMethodField()
    is_member = serializers.SerializerMethodField()

    class Meta:
        model = Team
        fields = [
            "id",
            "name",
            "description",
            "team_type",
            "team_logo",
            "owner",
            "owner_details",
            "members_count",
            "is_member",
            "created_at"
        ]
        read_only_fields = ["owner"]

    def get_members_count(self, obj):
        return obj.members.count()

    def get_is_member(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return obj.members.filter(id=request.user.id).exists()
        return False


class TeamDetailSerializer(TeamSerializer):
    members_details = UserMinimalSerializer(source="members", many=True, read_only=True)

    class Meta(TeamSerializer.Meta):
        fields = TeamSerializer.Meta.fields + ["members_details"]


class TeamInvitationSerializer(serializers.ModelSerializer):
    team_details = TeamSerializer(source="team", read_only=True)
    sender_details = UserMinimalSerializer(source="sender", read_only=True)
    receiver_details = UserMinimalSerializer(source="receiver", read_only=True)

    class Meta:
        model = TeamInvitation
        fields = [
            "id",
            "team",
            "team_details",
            "sender",
            "sender_details",
            "receiver",
            "receiver_details",
            "request_type",
            "status",
            "created_at"
        ]
        read_only_fields = ["sender", "status"]


class TeamMessageSerializer(serializers.ModelSerializer):
    sender_details = UserMinimalSerializer(source="sender", read_only=True)

    class Meta:
        model = TeamMessage
        fields = [
            "id",
            "team",
            "sender",
            "sender_details",
            "text",
            "is_deleted",
            "created_at"
        ]
        read_only_fields = ["sender"]
