from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.contrib.auth import authenticate, login
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny

from django.contrib.auth.models import User
from users.models import Profile

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
    username = request.data.get("username")
    password = request.data.get("password")
    email = request.data.get("email")

    if User.objects.filter(username=username).exists():
        return Response({"error": "Username already exists"}, status=400)

    user = User.objects.create_user(
        username=username,
        email=email,
        password=password
    )

    # Create an empty profile for the new user
    Profile.objects.create(
        user=user,
        name=username
    )

    return Response({"message": "User registered successfully"})