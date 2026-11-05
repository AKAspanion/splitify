import { HttpsError, onCall } from "firebase-functions/v2/https";

// Task 4 fills this in: anonymise the caller, delete their data, then their Firebase Auth user.
export const deleteMyAccount = onCall({ region: "asia-south1" }, () => {
  throw new HttpsError("unimplemented", "unimplemented");
});
