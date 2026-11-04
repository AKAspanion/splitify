import { auth, clerkClient } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { generateRegistrationOptions } from "@simplewebauthn/server";
import type { GenerateRegistrationOptionsOpts } from "@simplewebauthn/server";
import { isoUint8Array } from "@simplewebauthn/server/helpers";
import DevicesService from "@/lib/auth/service/devices";

const rpID = process.env.AUTHN_RP_ID || "localhost";

export async function GET(_req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await (await clerkClient()).users.getUser(userId);

    const devices = await DevicesService.getDevice(userId);

    const name =
      [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
      userId;

    const opts: GenerateRegistrationOptionsOpts = {
      rpName: "Splitify WebAuthn",
      rpID,
      // SimpleWebAuthn 9 sent the Clerk id's UTF-8 bytes as the user handle; keep sending the same bytes.
      userID: isoUint8Array.fromUTF8String(userId),
      userName: name,
      timeout: 60000,
      attestationType: "none",
      /**
       * Passing in a user's list of already-registered authenticator IDs here prevents users from
       * registering the same device multiple times. The authenticator will simply throw an error in
       * the browser if it's asked to perform registration when one of these ID's already resides
       * on it.
       */
      excludeCredentials: devices?.map((dev) => ({
        id: dev.id,
        transports: dev.transports,
      })),
      authenticatorSelection: {
        residentKey: "discouraged",
        /**
         * Wondering why user verification isn't required? See here:
         *
         * https://passkeys.dev/docs/use-cases/bootstrapping/#a-note-about-user-verification
         */
        userVerification: "preferred",
      },
      /**
       * Support the two most common algorithms: ES256, and RS256
       */
      supportedAlgorithmIDs: [-7, -257],
    };

    const data = await generateRegistrationOptions(opts);

    /**
     * The server needs to temporarily remember this value for verification, so don't lose it until
     * after you verify an authenticator response.
     */
    const session = await getIronSession<{ currentChallenge?: string }>(
      await cookies(),
      {
        password: "supersecretamazingpassword123456",
        cookieName: "challenge",
      },
    );
    session.currentChallenge = data?.challenge;
    await session.save();

    return NextResponse.json({ data }, { status: 200 });
  } catch (error: any) {
    console.trace(error);
    return NextResponse.json(
      { message: error?.message || "Something went wrong" },
      { status: 500 },
    );
  }
}
