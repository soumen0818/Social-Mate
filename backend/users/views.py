from rest_framework import generics
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Q

from follows.models import Follow
from users.models import User
from users.serializers import UserMeSerializer

class UserDetailView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    queryset = User.objects.all()
    serializer_class = UserMeSerializer
    lookup_field = 'id'


class UserListView(generics.ListAPIView):
    """Discover people: search all users, excludes current user.
    Supports ?search=<query> query parameter.
    Returns is_following status for each user."""
    permission_classes = [IsAuthenticated]
    serializer_class = UserMeSerializer

    def get_queryset(self):
        qs = User.objects.exclude(id=self.request.user.id)
        search = self.request.query_params.get('search', '').strip()
        if search:
            qs = qs.filter(
                Q(username__icontains=search) |
                Q(display_name__icontains=search) |
                Q(email__icontains=search)
            )
        return qs.order_by('-created_at')[:50]  # limit results

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        following_ids = set(
            Follow.objects.filter(follower=request.user)
            .values_list('following_id', flat=True)
        )
        serializer = self.get_serializer(queryset, many=True)
        data = serializer.data
        for user_data in data:
            user_data['is_following'] = user_data['id'] in following_ids
        return Response(data)

class HealthCheckView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        return Response({'status': 'ok', 'service': 'social-mate-backend'})


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserMeSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        # We only allow updating specific fields
        serializer = UserMeSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)                

    def put(self, request):
        return self.patch(request)