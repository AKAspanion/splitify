import { toUserMessage } from "@/lib/data/errors";
import { getFirebaseAuth } from "@/lib/firebase/app";

const readMessage = async (response: Response): Promise<string> => {
  try {
    const body: unknown = await response.json();
    const message = (body as { message?: unknown } | null)?.message;
    return typeof message === "string" ? message : "";
  } catch {
    return "";
  }
};

/**
 * Calls one of Splitify's Cloud Functions (a path under `/api/`) as the signed-in person: the Firebase ID token goes
 * in `Authorization: Bearer`. A failure throws an Error whose message a person can read (`toUserMessage`), never the
 * function's raw text.
 */
export async function callFunction(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  try {
    const user = getFirebaseAuth().currentUser;
    if (!user) throw { code: "unauthenticated" };
    const token = await user.getIdToken();
    const headers = new Headers(init.headers);
    headers.set("Authorization", `Bearer ${token}`);

    const response = await fetch(path, { ...init, headers });
    if (response.ok) return response;
    throw {
      code: response.status === 401 ? "unauthenticated" : "",
      message: await readMessage(response),
    };
  } catch (error) {
    throw new Error(toUserMessage(error));
  }
}
