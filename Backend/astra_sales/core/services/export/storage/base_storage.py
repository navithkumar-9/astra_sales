from abc import ABC, abstractmethod

class BaseStorageProvider(ABC):
    """
    Abstract interface for storage providers.
    Follows Dependency Inversion Principle (DIP) and Open/Closed Principle (OCP).
    """

    @abstractmethod
    def save_chunk(self, file_key: str, data: bytes, append: bool = True) -> str:
        """
        Save a chunk of bytes to storage.
        Returns the relative/absolute file path/URI.
        """
        pass

    @abstractmethod
    def finalize(self, file_key: str) -> str:
        """
        Perform any post-processing on the file (e.g. finalizing uploads/links).
        Returns the public download URL or path.
        """
        pass

    @abstractmethod
    def delete(self, file_path: str) -> None:
        """Delete file from storage."""
        pass
