import os
from django.conf import settings
from core.services.export.storage.base_storage import BaseStorageProvider

class LocalStorageProvider(BaseStorageProvider):
    """
    Local filesystem storage provider implementation.
    Follows Single Responsibility Principle (SRP) and Dependency Inversion Principle (DIP).
    """

    def __init__(self, base_dir: str = None):
        self.base_dir = base_dir or os.path.join(settings.MEDIA_ROOT, "exports")
        os.makedirs(self.base_dir, exist_ok=True)

    def save_chunk(self, file_key: str, data: bytes, append: bool = True) -> str:
        file_path = os.path.join(self.base_dir, file_key)
        mode = 'ab' if append else 'wb'
        with open(file_path, mode) as f:
            f.write(data)
        return file_path

    def finalize(self, file_key: str) -> str:
        # For local filesystem, finalizing is a no-op; we return the absolute filepath.
        # But wait, it should be relative to MEDIA_ROOT or absolute depending on how it's saved.
        # Returning absolute path is fine; we will build down url dynamically in the view or here.
        file_path = os.path.join(self.base_dir, file_key)
        return file_path

    def delete(self, file_path: str) -> None:
        if file_path and os.path.exists(file_path):
            try:
                os.remove(file_path)
            except OSError:
                pass
