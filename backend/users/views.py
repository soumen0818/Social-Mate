from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from users.serializers import UserMeSerializer


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
