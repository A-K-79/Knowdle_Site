import re

def clean_cloudinary_url(url):
    if not url:
        return url
        
    # Check if this is a Cloudinary URL (even if prepended or broken)
    if "cloudinary.com" in url:
        # Find where the cloudinary part starts (detect http, https, or //)
        match = re.search(r'(https?/?/?|//)res\.cloudinary\.com', url)
        if match:
            start_index = match.start()
            cloudinary_part = url[start_index:]
            
            # Clean up double slashes without colon: https// -> https://
            if cloudinary_part.startswith("https//"):
                return "https://" + cloudinary_part[7:]
            if cloudinary_part.startswith("http//"):
                return "http://" + cloudinary_part[6:]
            if cloudinary_part.startswith("//"):
                return "https:" + cloudinary_part
            return cloudinary_part
            
    return url
