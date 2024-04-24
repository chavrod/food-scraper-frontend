// eslint-disable-next-line import/prefer-default-export
export const normalizeQueryParams = <T extends Record<string, any>>(
  params: T,
  currentPath: string,
  targetPath: string
): Record<string, string | never> => {
  if (currentPath !== targetPath) {
    // If the current path does not match the target path, return undefined
    return {};
  }

  // If paths match, normalize the query parameters
  return Object.entries(params).reduce(
    (acc: { [key: string]: string }, [key, value]) => {
      if (value !== undefined) {
        // Check if value is not undefined
        acc[key] = value.toString().toLowerCase();
      }
      return acc;
    },
    {}
  );
};
