from django.shortcuts import render

# Create your views here.

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .services import summarize_notes

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def summarize(request):
    text = request.data.get("text")

    if not text:
        return Response({"error": "Text is required"}, status=400)

    summary = summarize_notes(text)

    return Response({
        "summary": summary
    })
