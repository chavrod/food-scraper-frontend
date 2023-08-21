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

        query = text_data_json["query"]
        is_relevant_only_str = text_data_json["is_relevant_only"]
        is_relevant_only = is_relevant_only_str.lower() == "true"
        sender = text_data_json["sender"]

        print("RECEIVED MESSAGE FROM CLIENT: ", query, is_relevant_only)

        cached_page = await self.check_for_entry(query, is_relevant_only)

        # Check if entry_data was found and send relevant information
        if cached_page:
            await self.send(
                text_data=json.dumps(
                    {
                        "query": cached_page["products"]["query"],
                        "results": cached_page["products"]["results"],
                        "total_pages": cached_page["total_pages"],
                        "current_page": cached_page["current_page"],
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
        # Set for 3 minutes for now
        start_time = time.time()
        duration = 60 * 3
        end_time = time.time() + duration
        while time.time() < end_time:
            time_passed = time.time() - start_time
            print(f"{time_passed} seconds passed, CHECKING RESULTS FOR {query}...")
            cached_page = await database_sync_to_async(self.entry_exists)(
                query, is_relevant_only
            )
            if cached_page is not False:
                print("FOUND CACHED PAGE: ", cached_page["page_instance"])
                return cached_page
            else:
                print(f"NOTHING FOUND FOR {query}, SLEEPING FOR 20 SECONDS....")
                await asyncio.sleep(20)  # Wait for 20 seconds before checking again

    @staticmethod
    def entry_exists(query, is_relevant_only):
        try:
            cached_page = core_models.CachedProductsPage.objects.get(
                query=query, is_relevant_only=is_relevant_only, page=1
            )
            total_pages = core_models.CachedProductsPage.objects.filter(
                query=query, is_relevant_only=is_relevant_only
            ).count()

            return {
                "page_instance": cached_page,
                "total_pages": total_pages,
                "current_page": 1,
            }
        except core_models.CachedProductsPage.DoesNotExist:
            return False
