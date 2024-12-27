import asyncio
import json
import re

import aioredis
import django
import websockets

django.setup()


# This dictionary will store connections based on queries
CONNECTIONS = {}


async def handler(websocket, path):
    try:
        # Parse the query parameter from the connection path
        parsed_query = path.strip("/")  # Assuming path comes as '/somequery'
        cleaned_query = re.sub(r"\s+", " ", parsed_query.strip()).lower()
        # Register the connection with the query
        if cleaned_query not in CONNECTIONS:
            CONNECTIONS[cleaned_query] = []
        CONNECTIONS[cleaned_query].append(websocket)

        # Wait for the connection to close
        await asyncio.wait_for(websocket.wait_closed(), timeout=30)
    except asyncio.TimeoutError:
        print(f"Timeout reached for query: {cleaned_query}")
        await websocket.close(reason="Connection time limit reached.")
    finally:
        # Remove the connection after it is closed
        if cleaned_query in CONNECTIONS:
            CONNECTIONS[cleaned_query].remove(websocket)
            if not CONNECTIONS[cleaned_query]:
                del CONNECTIONS[cleaned_query]
        print(f"WEBSOCKET Connection closed for query: {cleaned_query}")


async def process_events():
    """Listen to events in Redis and process them."""
    redis = aioredis.from_url("redis://127.0.0.1:6379")
    pubsub = redis.pubsub()
    await pubsub.subscribe("scraping_queries")
    async for message in pubsub.listen():
        if message["type"] != "message":
            continue
        payload = json.loads(message["data"].decode())
        query = payload["query"].lower()
        status = payload["status"]

        # Broadcast event to all clients connected with the specific query
        if query in CONNECTIONS:
            recipients = CONNECTIONS[query]
            print("RECEPIRENTS: ", recipients)
            message_to_send = json.dumps({"query": query, "status": status})
            websockets.broadcast(recipients, message_to_send)


async def handle_or_exit(websocket, path):
    try:
        await handler(websocket, path)
    except Exception as e:
        # TODO: See if more specific code might prove useful
        exit(11)


async def main():
    async with websockets.serve(handle_or_exit, "127.0.0.1", 8888):
        await process_events()  # runs forever


if __name__ == "__main__":
    asyncio.run(main())
