from abc import ABC, abstractmethod


class ShopScraper(ABC):

    @abstractmethod
    def get_products(self, query: str, is_relevant_only: bool):
        pass
