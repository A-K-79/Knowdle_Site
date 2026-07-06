Module: User Profile
API Endpoints

1. Register User

Method POST
Endpoint  /auth/register/

Request Body
{
    "username": "abhi",
    "email": "abhi@gmail.com",
    "password": "Password123"
}
2. Login User

Method POST

Endpoint /auth/login/

Request Body
{
    "username": "abhi",
    "password": "Password123"
}
Response

{
    "token": "xxxxxxxxxxxxxxxxxxxxxxxx",
    "username": "abhi"
}
3. Get Profile
Method GET

Endpoint /api/profile/

Headers
Authorization: Token <token>

Response
{
    "profile_picture": null,
    "name": "Abhijith",
    "bio": "AI Developer",
    "department": "CSE",
    "skills": "Python, Django"
}
4. Update Profile
Method PUT
Endpoint /api/profile/

Headers
Authorization: Token <token>

If updating only text fields:
{
    "name": "Abhijith",
    "bio": "Backend Developer",
    "department": "CSE",
    "skills": "Python, Django, React"
}
If updating the profile picture, send the request as form-data with:
Key	Type
profile_picture	File
name	Text
bio	Text
department	Text


skills	Text
