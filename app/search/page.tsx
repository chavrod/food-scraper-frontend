import SearchResults from "./SearchResults";
import FetchData from "./FetchData";

async function searchProducts(searchText = "") {
  if (searchText === "") return;
  return FetchData({ query: searchText });
}

type Props = {
  searchParams?: {
    q?: string | undefined;
  };
};

export default async function Home(params: Props) {
  const searchText = params.searchParams?.q;
  const results = await searchProducts(searchText);
  const { products, summary } = results || { products: [], summary: [] };

  const handlePageChangle = (page) => {};

  return (
    <>
      <SearchResults
        products={products}
        handlePageChangle={handlePageChangle}
      />
    </>
  );
}
