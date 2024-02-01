from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
import asyncio
import json
import time

import core.models as core_models


class ScrapedPageConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        print("connection OPENED")
        await self.accept()

    async def disconnect(self, close_code):
        print("connection CLOSED: ", close_code)
        pass

    async def receive(self, text_data=None, bytes_data=None):
        text_data_json = json.loads(text_data)

        query = text_data_json["query"].rstrip()
        is_relevant_only = True
        sender = text_data_json["sender"]

        print("RECEIVED MESSAGE FROM CLIENT: ", query, is_relevant_only)

        cached_page_exists = await self.check_for_entry(query, is_relevant_only)

        # Check if entry_data was found and send relevant information
        if cached_page_exists:
            await self.send(
                text_data=json.dumps(
                    {
                        "query": query,
                        "sender": "Server",
                    }
                )
            )
        else:
            await self.send(
                text_data=json.dumps(
                    {
                        "message": "No entry found after multiple checks.",
                        "sender": "Server",
                    }
                )
            )

        await self.close()  # Close the connection

    async def check_for_entry(self, query, is_relevant_only):
        retry_gap_seconds = 5
        # Set for 3 minutes for now
        start_time = time.time()
        duration = 60 * 3
        end_time = start_time + duration
        while time.time() < end_time:
            time_passed = time.time() - start_time
            print(f"{time_passed} seconds passed, CHECKING RESULTS FOR {query}...")
            cached_page_exists = await database_sync_to_async(self.entry_exists)(
                query, is_relevant_only
            )
            if cached_page_exists is not False:
                return True
            else:
                print(
                    f"NOTHING FOUND FOR {query}, SLEEPING FOR {retry_gap_seconds} SECONDS...."
                )
                await asyncio.sleep(retry_gap_seconds)

    @staticmethod
    def entry_exists(query, is_relevant_only):
        return core_models.CachedProductsPage.objects.filter(
            query=query, is_relevant_only=is_relevant_only, page=1
        ).exists()
