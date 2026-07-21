import os
from django.core.mail import EmailMessage

class AttachmentService:
    """
    Dedicated service for handling email attachments.
    Follows Single Responsibility Principle (SRP).
    """

    @staticmethod
    def attach_file(email: EmailMessage, file_path: str, content_type: str = "text/csv") -> None:
        """
        Attaches a file from a local file path to a Django EmailMessage object.

        Args:
            email (EmailMessage): The email message object to attach the file to.
            file_path (str): The absolute local filesystem path of the file to attach.
            content_type (str): The mime type of the attachment (defaults to text/csv).
            
        Raises:
            FileNotFoundError: If the file at file_path does not exist.
        """
        if not file_path or not os.path.exists(file_path):
            raise FileNotFoundError(f"Attachment file not found at path: {file_path}")
        
        filename = os.path.basename(file_path)
        with open(file_path, 'rb') as f:
            email.attach(filename, f.read(), content_type)
