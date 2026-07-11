from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.contrib.auth import authenticate, login
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny

from django.contrib.auth.models import User
from users.models import Profile
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import logout

# from rest_framework.decorators import api_view

# @api_view(["POST"])
# def login_view(request):
#     username = request.data.get("username")
#     password = request.data.get("password")
#     user = authenticate(request, username=username, password=password)
#     if user is not None:
#         login(request, user)  # ✅ establish session
#         token, _ = Token.objects.get_or_create(user=user)
#         return Response({"token": token.key, "username": user.username})
#     return Response({"error": "Invalid credentials"}, status=400)

@api_view(["POST"])
@permission_classes([AllowAny])
def login_view(request):
    username = request.data.get("username")
    password = request.data.get("password")

    user = authenticate(username=username, password=password)

    if user:
        token, _ = Token.objects.get_or_create(user=user)
        return Response({
            "token": token.key,
            "username": user.username
        })

    return Response({"error": "Invalid credentials"}, status=400)


@api_view(["POST"])
@permission_classes([AllowAny])
def register_view(request):
    name = request.data.get("name", "").strip()
    username = request.data.get("username", "").strip()
    password = request.data.get("password", "").strip()
    email = request.data.get("email", "").strip()

    if not name:
        return Response({"error": "Name is required"}, status=400)
    if not username:
        return Response({"error": "Username is required"}, status=400)
    if not password:
        return Response({"error": "Password is required"}, status=400)

    if User.objects.filter(username=username).exists():
        return Response({"error": "Username already exists"}, status=400)

    user = User.objects.create_user(
        username=username,
        email=email,
        password=password
    )

    # Create profile with registered name
    Profile.objects.create(
        user=user,
        name=name
    )

    return Response({"message": "User registered successfully"})

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout_view(request):
    # Clear Django session
    logout(request)

    # Delete the token so it can't be reused
    request.user.auth_token.delete()

    return Response({"message": "Successfully logged out"})