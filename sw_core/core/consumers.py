from channels.generic.websocket import AsyncWebsocketConsumer
import asyncio
import json


class ScrapedPageConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        print("connection OPENED")
        await self.accept()

    async def disconnect(self, close_code):
        print("connection CLOSED: ", close_code)
        pass

    async def receive(self, text_data=None, bytes_data=None):
        text_data_json = json.loads(text_data)
        message = text_data_json["message"]
        sender = text_data_json["sender"]

        print(f"{sender}: {message}")

        await asyncio.sleep(5)  # Wait for 5 seconds

        await self.send(
            text_data=json.dumps(
                {"message": "Response after 5 seconds", "sender": "Server"}
            )
        )
        await self.close()  # Close the connection
