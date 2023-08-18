import { ScrapeStats } from "@/utils/types";

type Params = { [name: string]: any };

type ApiFunction<P> = (params: P) => Promise<Response>;

interface GetDataProps<P = Params> {
  params: P;
  apiFunc: ApiFunction<P>;
  unpackName: string;
}

interface GetDataReturnType<DataType, ScrapeStats> {
  data: DataType | ScrapeStats | undefined;
  error: boolean;
}

export default async function getData<DataType, P extends object = Params>({
  params,
  apiFunc,
  unpackName,
}: GetDataProps<P>): Promise<GetDataReturnType<DataType, ScrapeStats>> {
  if (apiFunc === undefined || ("query" in params && params.query === "")) {
    return { data: undefined, error: true };
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
    const dataRes = jsonRes.data as { [unpackName: string]: DataType };
    const data = dataRes[unpackName];

    return { data, error: false };
  } catch (error) {
    console.error("There was an error with the API call:", error);
    // Handle or re-throw the error based on your requirements
    throw error;
  }
}
