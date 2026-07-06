from django.db import models
from typing import TypeVar, Generic, Type, Optional, List

T = TypeVar('T', bound=models.Model)


class BaseRepository(Generic[T]):
    """Base repository abstracting data access from business logic.
    
    Follows Dependency Inversion Principle:
    - Services depend on this abstraction, not on Django ORM directly
    - Can be swapped for test doubles or alternative data sources
    
    Usage:
        class TaskRepository(BaseRepository[Task]):
            model_class = Task
            
            def find_overdue(self):
                return self.filter(due_date__lt=timezone.now(), status='open')
    """
    model_class: Type[T] = None

    def get_queryset(self):
        """Return the base queryset."""
        return self.model_class.objects.all()

    def get(self, pk) -> T:
        """Get a single instance by primary key."""
        return self.get_queryset().get(pk=pk)

    def filter(self, **kwargs):
        """Filter instances by given criteria."""
        return self.get_queryset().filter(**kwargs)

    def all(self):
        """Return all instances."""
        return self.get_queryset()

    def create(self, **kwargs) -> T:
        """Create and return a new instance."""
        return self.model_class.objects.create(**kwargs)

    def update(self, instance: T, **kwargs) -> T:
        """Update fields on an existing instance."""
        for key, value in kwargs.items():
            setattr(instance, key, value)
        instance.save(update_fields=list(kwargs.keys()))
        return instance

    def delete(self, instance: T) -> None:
        """Delete an instance."""
        instance.delete()

    def exists(self, **kwargs) -> bool:
        """Check if any instance matching criteria exists."""
        return self.get_queryset().filter(**kwargs).exists()

    def count(self, **kwargs) -> int:
        """Count instances matching criteria."""
        if kwargs:
            return self.get_queryset().filter(**kwargs).count()
        return self.get_queryset().count()
