export const urlBuilder = (
  baseUrl: string,
  params: Record<string, string | undefined | null>
): string => {
  const queryString = Object.entries(params)
    .filter(([_, value]) => {
      if (value === undefined || value === null) return false;
      if (typeof value === "string" && value.trim() === "") return false;
      return true;
    })
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(value as string)}`
    )
    .join("&");

  if (!queryString) return baseUrl;

  return baseUrl.includes("?")
    ? `${baseUrl}&${queryString}`
    : `${baseUrl}?${queryString}`;
};
