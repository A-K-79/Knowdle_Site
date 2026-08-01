import re

def clean_cloudinary_url(url, media_type=None):
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
                cloudinary_part = "https://" + cloudinary_part[7:]
            elif cloudinary_part.startswith("http//"):
                cloudinary_part = "http://" + cloudinary_part[6:]
            elif cloudinary_part.startswith("//"):
                cloudinary_part = "https:" + cloudinary_part
            
            if media_type == "VIDEO":
                if "/image/upload" in cloudinary_part:
                    cloudinary_part = cloudinary_part.replace("/image/upload", "/video/upload")
                elif "/raw/upload" in cloudinary_part:
                    cloudinary_part = cloudinary_part.replace("/raw/upload", "/video/upload")
                    
            return cloudinary_part
            
    return url

from cloudinary_storage.storage import MediaCloudinaryStorage

class DynamicMediaCloudinaryStorage(MediaCloudinaryStorage):
    def _get_resource_type(self, name):
        if not name:
            return 'image'
        parts = name.split('.')
        if len(parts) > 1:
            ext = parts[-1].lower()
            if ext in ['mp4', 'mov', 'avi', 'mkv', 'webm', '3gp', 'wmv', 'flv']:
                return 'video'
            elif ext in ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'zip', 'rar', 'txt', 'csv']:
                return 'raw'
        return 'image'
