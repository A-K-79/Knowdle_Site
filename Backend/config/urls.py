from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

# JWT imports
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

# Custom authentication view
from authentication.views import login_view

urlpatterns = [
    path("admin/", admin.site.urls),

    # API routes
    path("api/content/", include("content.urls")),

    # JWT AUTH routes
    path("api/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),

    # Authentication app routes
    path("auth/", include("authentication.urls")),
    path("login/", login_view),  # function-based DRF view

    # User profile routes
    # path("login/", login_view),  # function-based DRF view
    path("api/profile/", include("users.urls")),

    #follow route
    path("api/follow/", include("follow.urls")),

    #content route
    path("api/content/", include("content.urls")),

    #AI Summarizer route
    path("api/ai/", include("ai.urls")),
    # admin panel routes
    path("api/admin/", include("admin_panel.urls")),

    #Search
    path("api/search/", include("search.urls")),

    #Teams
    path("api/teams/", include("teams.urls")),

    #Events
    path("api/events/", include("events.urls")),
]

# MEDIA FILES
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
