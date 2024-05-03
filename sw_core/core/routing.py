from django.urls import path
from core.consumers import ScrapedPageConsumer

websocket_urlpatterns = [
    path("ws/scraped_result/<str:query>/", ScrapedPageConsumer.as_asgi()),
]
