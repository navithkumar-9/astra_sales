from django.db import models
from typing import TypeVar, Generic, Type, Optional
from rest_framework.exceptions import NotFound

T = TypeVar('T', bound=models.Model)


class BaseService(Generic[T]):
    """Base service class implementing common business logic patterns.
    
    Follows SOLID principles:
    - SRP: Encapsulates business logic, separate from views and data access
    - OCP: Extensible via method overriding without modifying base
    - DIP: Views depend on this abstraction, not concrete implementations
    
    Usage:
        class TaskService(BaseService[Task]):
            model_class = Task
            
            def assign_task(self, task_id, assignee_id):
                task = self.get_by_id(task_id)
                # custom business logic here
    """
    model_class: Type[T] = None

    def get_queryset(self):
        """Return the base queryset. Override to add default filters."""
        return self.model_class.objects.all()

    def get_by_id(self, pk) -> T:
        """Retrieve a single instance by primary key."""
        try:
            return self.get_queryset().get(pk=pk)
        except self.model_class.DoesNotExist:
            raise NotFound(f"{self.model_class.__name__} with id {pk} not found")

    def list(self, filters: Optional[dict] = None):
        """List instances with optional filtering."""
        qs = self.get_queryset()
        if filters:
            qs = qs.filter(**filters)
        return qs

    def create(self, **kwargs) -> T:
        """Create a new instance."""
        return self.model_class.objects.create(**kwargs)

    def update(self, pk, **kwargs) -> T:
        """Update an existing instance."""
        instance = self.get_by_id(pk)
        for key, value in kwargs.items():
            setattr(instance, key, value)
        instance.save(update_fields=list(kwargs.keys()) + ['updated_at'])
        return instance

    def delete(self, pk) -> None:
        """Delete an instance by primary key."""
        instance = self.get_by_id(pk)
        instance.delete()
