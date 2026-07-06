import os
from google import genai

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

def summarize_notes(text):
    try:
        prompt = f"""
        You are an AI assistant for students.

        Summarize the following study notes.

        Rules:
        - Use simple English.
        - Keep it under 150 words.
        - Return plain text only.
        - Do not use Markdown.
        - Use bullet points.

        Notes:
        {text}
        """

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )

        return response.text

    except Exception as e:
        return f"Error: {str(e)}"