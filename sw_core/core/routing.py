from django.urls import path
from core.consumers import ScrapedPageConsumer

websocket_urlpatterns = [path("ws/scraped_result/", ScrapedPageConsumer.as_asgi())]
