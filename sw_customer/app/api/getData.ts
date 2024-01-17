export type Params = { [name: string]: any };

interface GetDataProps<D, P> {
  params: P;
  apiFunc: (params: P) => Promise<Response>;
  transformFunc: (response: Response) => Promise<D>;
}

export default async function getData<D, P extends Params>({
  params,
  apiFunc,
  transformFunc,
}: GetDataProps<D, P>): Promise<{
  data: D | undefined;
  error: boolean | undefined;
}> {
  if (apiFunc === undefined || params.query === "") {
    return { data: undefined, error: undefined };
  }

  try {
    const res = await apiFunc(params);

    if (!res.ok) {
      throw new Error(`HTTP error! Status: ${res.status}`);
    }

    // Transform the response using the provided function
    const transformedData = await transformFunc(res);

    return { data: transformedData, error: false };
  } catch (error) {
    console.error("There was an error with the API call:", error);
    // Handle or re-throw the error based on your requirements
    throw error;
  }
}
