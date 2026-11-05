import { onRequest } from "firebase-functions/v2/https";

// Task 3 fills this in: the /api/webauthn/* routes.
export const webauthn = onRequest({ region: "asia-south1" }, (_req, res) => {
  res.status(501).json({ message: "unimplemented" });
});
