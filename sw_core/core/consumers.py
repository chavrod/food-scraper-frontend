from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
import re
import asyncio
import json
import time
from datetime import timedelta

from django.utils import timezone

import core.models as core_models
from shop_wiz.settings import (
    RESULTS_EXPIRY_DAYS,
)


class ScrapedPageConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        query = self.scope["url_route"]["kwargs"]["query"]
        self.cleaned_query = re.sub(r"\s+", " ", query.strip()).lower()
        print(f"connection OPENED for {self.cleaned_query}")
        await self.accept()

    async def disconnect(self, close_code):
        print(f"connection CLOSED for {self.cleaned_query}")
        pass

    async def receive(self, text_data=None, bytes_data=None):
        try:
            cached_page_exists = await self.check_for_entry(self.cleaned_query)

            # Check if entry_data was found and send relevant information
            if cached_page_exists:
                await self.send(
                    text_data=json.dumps(
                        {
                            "query": self.cleaned_query,
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
        except Exception as e:
            await self.send(
                text_data=json.dumps(
                    {
                        "message": f"A an error occured: {str(e)}",
                        "sender": "Server",
                    }
                )
            )

        await self.close()  # Close the connection

    async def check_for_entry(self, query):
        retry_gap_seconds = 2
        duration_seconds = 30
        start_time = time.time()
        end_time = start_time + duration_seconds
        while time.time() < end_time:
            time_passed = time.time() - start_time
            print(f"{time_passed} seconds passed, CHECKING RESULTS FOR {query}...")
            cached_page_exists = await database_sync_to_async(self.entry_exists)(query)
            if cached_page_exists is not False:
                return True
            else:
                print(
                    f"NOTHING FOUND FOR {query}, SLEEPING FOR {retry_gap_seconds} SECONDS...."
                )
                await asyncio.sleep(retry_gap_seconds)

    @staticmethod
    def entry_exists(query):
        # Calculate the date before which no similar batch upload should exist
        expiry_date = timezone.now() - timedelta(days=RESULTS_EXPIRY_DAYS)

        # Check for recent batch uploads with the same query
        return core_models.BatchUpload.objects.filter(
            query=query, upload_date__gte=expiry_date
        ).exists()
