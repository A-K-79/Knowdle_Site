import os
from google import genai

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

def summarize_notes(text, team_type=None):
    try:
        if team_type == "STUDY":
            prompt = f"""
            You are an AI assistant for a Study Team.
            
            Summarize the following recent posts, academic discussions, notes shared, resources shared, questions asked, and important concepts.
            
            Strictly format the output as follows:
            
            📚 AI Study Summary
            
            Summary:
            [Write a concise summary of the academic discussions and concepts shared]
            
            Key Topics:
            • [Topic 1]
            • [Topic 2]
            • [Topic 3]
            
            Important Resources:
            • [Resource name or link from the posts, or None if none]
            
            Suggested Revision:
            [Provide a suggested revision action or question for self-testing]
            
            Rules:
            - Do not use Markdown styling (* or #) in the headers. Keep it plain text.
            - Follow the exact casing and layout.
            - Use bullet points where indicated.
            
            Posts:
            {text}
            """
        elif team_type == "PROFESSIONAL":
            prompt = f"""
            You are an AI assistant for a Professional Team.
            
            Summarize the following recent posts, project updates, task completions, team discussions, milestones, and progress.
            
            Strictly format the output as follows:
            
            💼 AI Sprint Summary
            
            Project Progress:
            [Summarize the current progress on projects/milestones]
            
            Completed:
            ✔ [Completed task 1]
            ✔ [Completed task 2]
            
            Pending:
            ⏳ [Pending task 1]
            ⏳ [Pending task 2]
            
            Risks:
            [Identify any risks or blockers discussed, or None if none]
            
            Suggested Next Step:
            [Provide suggested next action items]
            
            Rules:
            - Do not use Markdown styling (* or #) in the headers. Keep it plain text.
            - Follow the exact casing and layout.
            
            Posts:
            {text}
            """
        elif team_type == "FRIENDS":
            prompt = f"""
            You are an AI assistant for a Friends private social group.
            
            Summarize the following recent posts, plans, events, conversations, photos shared, and casual discussions.
            
            Strictly format the output as follows:
            
            👥 AI Conversation Summary
            
            Today's Highlights:
            [Concise summary of highlights and general conversation]
            
            Plans Made:
            [Summarize any plans made, location, times, or None if none]
            
            Participants:
            [List of names of people participating in the discussions]
            
            Upcoming Events:
            [List any upcoming events or deadlines mentioned, or None if none]
            
            Rules:
            - Do not use Markdown styling (* or #) in the headers. Keep it plain text.
            - Follow the exact casing and layout.
            
            Posts:
            {text}
            """
        else:
            # Default fallback to original behavior
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