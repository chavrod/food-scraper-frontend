import SearchResults from "./SearchResults";
import FetchData from "./FetchData";

async function searchProducts(searchText = "", page = "") {
  if (searchText === "") return;
  return FetchData({ query: searchText, page: page });
}

type Props = {
  searchParams?: {
    q?: string | undefined;
    p?: string | undefined;
  };
};

export default async function Home(params: Props) {
  const searchText = params.searchParams?.q;
  const searchPage = params.searchParams?.p;
  const results = await searchProducts(searchText, searchPage);
  const { products, summaryPerShop, searchMetaData } = results || {
    products: [],
    summaryPerShop: [],
    searchMetaData: {},
  };

  // const handlePageChangle = (page) => {};

  return (
    <>
      <SearchResults
        products={products}
        summaryPerShop={summaryPerShop}
        searchMetaData={searchMetaData}
        // handlePageChangle={handlePageChangle}
      />
    </>
  );
}
