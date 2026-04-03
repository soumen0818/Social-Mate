import jwt
from django.conf import settings
from rest_framework import authentication
from rest_framework import exceptions
from users.models import User


_jwk_client = None


def _get_jwk_client():
    global _jwk_client
    if _jwk_client is None:
        if not settings.SUPABASE_URL:
            raise exceptions.AuthenticationFailed('Supabase URL is not configured.')
        jwks_url = f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1/.well-known/jwks.json"
        _jwk_client = jwt.PyJWKClient(jwks_url)
    return _jwk_client

class SupabaseJWTAuthentication(authentication.BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION')
        
        if not auth_header:
            return None # Authentication not attempted

        parts = auth_header.split()

        if len(parts) != 2 or parts[0].lower() != 'bearer':
            raise exceptions.AuthenticationFailed('Invalid authorization header. Expected a Bearer token.')

        token = parts[1]

        try:
            unverified_header = jwt.get_unverified_header(token)
            algorithm = unverified_header.get('alg', 'HS256')

            if algorithm == 'HS256':
                if not settings.SUPABASE_JWT_SECRET:
                    raise exceptions.AuthenticationFailed('Supabase JWT secret is not configured.')

                payload = jwt.decode(
                    token,
                    settings.SUPABASE_JWT_SECRET,
                    algorithms=['HS256'],
                    options={'verify_aud': False}
                )
            else:
                signing_key = _get_jwk_client().get_signing_key_from_jwt(token).key
                payload = jwt.decode(
                    token,
                    signing_key,
                    algorithms=[algorithm],
                    options={'verify_aud': False}
                )
        except jwt.ExpiredSignatureError:
            raise exceptions.AuthenticationFailed('Token has expired.')
        except jwt.InvalidTokenError:
            raise exceptions.AuthenticationFailed('Error decoding token.')

        # Supabase JWTs contain the user's UUID in the 'sub' claim
        user_id = payload.get('sub')
        email = payload.get('email')
        metadata = payload.get('user_metadata') or {}
        display_name = metadata.get('name', '')
        username_seed = (email.split('@')[0] if email else 'user').strip() or 'user'
        username_seed = username_seed[:141]
        generated_username = f'{username_seed}-{str(user_id)[:8]}'

        user, _created = User.objects.get_or_create(
            id=user_id,
            defaults={
                'username': generated_username,
                'email': email,
                'display_name': display_name,
            },
        )

        updates = []
        if not user.username:
            user.username = generated_username
            updates.append('username')
        if email and user.email != email:
            user.email = email
            updates.append('email')
        if display_name and user.display_name != display_name:
            user.display_name = display_name
            updates.append('display_name')

        if updates:
            user.save(update_fields=updates)

        return (user, token)
