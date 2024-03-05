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
    .filter(([_, v]) => !!v)
    .map(([k, v]) => k + "=" + v)
    .join("&")
    .trim();
  return encodeURI(path + (queryParams === "" ? "" : `?${queryParams}`));
};

export const getInitials = (fullName: string) => {
  const words = fullName.split(" ").filter(Boolean);

  const firstNameInitial = words[0];

  const otherInitials = words.slice(1).map((word) => word.charAt(0));
  const joinedOtherIntials = otherInitials.join(". ").trim();

  const formattedInitials = [
    firstNameInitial,
    joinedOtherIntials ? joinedOtherIntials + "." : "",
  ].join(" ");

  return formattedInitials.trim();
};
