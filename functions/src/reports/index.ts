import { onRequest } from "firebase-functions/v2/https";

// Task 2 fills this in: POST /api/reports/expenses.
export const reports = onRequest({ region: "asia-south1" }, (_req, res) => {
  res.status(501).json({ message: "unimplemented" });
});
