from abc import ABC, abstractmethod


class ShopScraper(ABC):

    @abstractmethod
    def scrape(self):
        pass
