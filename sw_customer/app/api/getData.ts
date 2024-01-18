export type Params = { [name: string]: any };

interface GetDataProps<D, P> {
  params: P;
  apiFunc: (params: P) => Promise<Response>;
}

export default async function getData<D, P extends Params>({
  params,
  apiFunc,
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

    const jsonRes: D = await res.json();

    return { data: jsonRes, error: false };
  } catch (error) {
    console.error("There was an error with the API call:", error);
    // Handle or re-throw the error based on your requirements
    throw error;
  }
}
