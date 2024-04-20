// Function to normalize query parameters
interface QueryParams {
  [key: string]: string | number | boolean;
}

// eslint-disable-next-line import/prefer-default-export
export const normalizeQueryParams = <T extends Record<string, any>>(
  params: T
): Record<string, string> =>
  Object.entries(params).reduce(
    (acc: { [key: string]: string }, [key, value]) => {
      if (value !== undefined) {
        // Check if value is not undefined
        acc[key] = value.toString().toLowerCase();
      }
      return acc;
    },
    {}
  );
