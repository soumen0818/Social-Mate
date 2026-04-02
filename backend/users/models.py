from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
import uuid

class UserManager(BaseUserManager):
    def create_user(self, id, username, **extra_fields):
        if not id:
            raise ValueError('The User must have an ID tied to Supabase Auth')
        if not username:
            raise ValueError('The User must have a username')
            
        user = self.model(id=id, username=username, **extra_fields)
        user.set_unusable_password()  # Passwords are managed by Supabase, not Django!
        user.save(using=self._db)
        return user

    def create_superuser(self, id, username, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(id, username, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin):
    # Match Supabase's UUID format
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    username = models.CharField(max_length=150, unique=True, blank=True, null=True)
    email = models.EmailField(unique=True, null=True)
    display_name = models.CharField(max_length=150, blank=True)
    bio = models.TextField(blank=True)
    avatar_url = models.URLField(blank=True, null=True)
    
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = []

    def __str__(self):
        return self.username
