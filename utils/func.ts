export const randomNumber = (minimum: number, maximum: number) =>
  Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;

export const urlEncode = ({
  path = "",
  query = {},
}: {
  path?: string;
  query?: Record<string, string>;
}) => {
  const queryParams = Object.entries(query)
    .map(([k, v]) => k + "=" + v)
    .join("&")
    .trim();
  return encodeURI(path + (queryParams === "" ? "" : `?${queryParams}`));
};
