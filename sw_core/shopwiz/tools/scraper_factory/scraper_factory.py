from inspect import getmembers, isclass, isabstract
from . import shop_scrapers


class ScraperFactory:
    scrapers = {}

    def __init__(self) -> None:
        self.load_scrapers()

    def load_scrapers(self):
        scrapers = getmembers(shop_scrapers, lambda m: isclass(m) and not isabstract(m))
        for name, _type in scrapers:
            if isclass(_type) and issubclass(_type, shop_scrapers.ShopScraper):
                self.scrapers[name] = _type

    def create(self, scraper_type: str):
        if scraper_type in self.scrapers:
            return self.scrapers[scraper_type]()
        else:
            raise ValueError(f"{scraper_type} is not currently supported")
