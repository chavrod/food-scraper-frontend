import json
from django_redis import get_redis_connection


def notify_scrape_completion(query, status="completed", instance=None):
    print("notify_scrape_completion query: ", query)
    connection = get_redis_connection("default")
    payload = {
        "query": query,
        "status": status,
    }
    connection.publish("scraping_queries", json.dumps(payload))
