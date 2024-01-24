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
  errorMessage: string | undefined;
}> {
  if (apiFunc === undefined || params.query === "") {
    return { data: undefined, errorMessage: undefined };
  }

  try {
    const res = await apiFunc(params);

    if (!res.ok) {
      const errorMessage = await res.json();

      throw new Error(errorMessage);
    }

    const jsonRes: D = await res.json();

    return { data: jsonRes, errorMessage: undefined };
  } catch (error) {
    const returnedError =
      error instanceof Error ? error : new Error(String(error));
    return { data: undefined, errorMessage: returnedError.message };
  }
}
