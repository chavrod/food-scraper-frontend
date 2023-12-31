import {
  ScrapeStats,
  Product,
  SearchParams,
  SearchMetaData,
} from "@/utils/types";

type ApiFunction = (params: SearchParams) => Promise<Response>;

interface GetDataProps {
  params: SearchParams;
  apiFunc: ApiFunction;
}

interface ProductData {
  results: Product[];
  metadata: SearchMetaData;
}

interface GetDataReturnType {
  data: ProductData | ScrapeStats | undefined;
  error: boolean | undefined;
}

export default async function getData({
  params,
  apiFunc,
}: GetDataProps): Promise<GetDataReturnType> {
  if (apiFunc === undefined || params.query === "") {
    return { data: undefined, error: undefined };
  }

  try {
    const res = await apiFunc(params);

    if (res.status === 206) {
      const jsonRes = await res.json();
      return {
        data: { averageTimeSeconds: jsonRes.averageTimeSeconds },
        error: false,
      };
    }

    if (!res.ok) {
      throw new Error(`HTTP error! Status: ${res.status}`);
    }

    const jsonRes = await res.json();

    const mappedData: ProductData = {
      results: jsonRes.results,
      metadata: {
        currentPage: jsonRes.page,
        totalPages: jsonRes.total_pages,
        keyword: jsonRes.query,
        isRelevantOnly: jsonRes.is_relevant_only,
      },
    };

    return { data: mappedData, error: false };
  } catch (error) {
    console.error("There was an error with the API call:", error);
    // Handle or re-throw the error based on your requirements
    throw error;
  }
}
