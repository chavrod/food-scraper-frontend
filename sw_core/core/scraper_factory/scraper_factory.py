from inspect import getmembers, isclass, isabstract
import scraper_factory


class ExtractorFactory:
    scrapers = {}

    def __init__(self) -> None:
        self.load_scrapers()

    def load_scrapers(self):
        scrapers = getmembers(
            scraper_factory, lambda m: isclass(m) and not isabstract(m)
        )
        for name, _type in scrapers:
            if isclass(_type) and issubclass(_type, scraper_factory.S):
                self.scrapers[name] = _type

    def create(self, extractor_type: str):
        if extractor_type in self.scrapers:
            return self.scrapers
        else:
            raise ValueError(f"{extractor_type} is not currently supported")
