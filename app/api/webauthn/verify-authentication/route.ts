import { NextResponse } from "next/server";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import type {
  VerifiedAuthenticationResponse,
  VerifyAuthenticationResponseOpts,
} from "@simplewebauthn/server";
import { isoBase64URL, isoUint8Array } from "@simplewebauthn/server/helpers";
import type { AuthenticationResponseJSON } from "@simplewebauthn/types";
import { auth } from "@clerk/nextjs";
import DevicesService from "@/lib/auth/service/devices";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";

const rpID = process.env.AUTHN_RP_ID || "splitify.spanion.in";
const expectedOrigin =
  process.env.AUTHN_EXPECTED_ORIGIN || "https://splitify.spanion.in";
export async function POST(req: Request) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body: AuthenticationResponseJSON = await req.json();

    const session = await getIronSession<{ currentChallenge?: string }>(
      cookies(),
      { password: "supersecretamazingpassword123456", cookieName: "challenge" }
    );
    const expectedChallenge = session.currentChallenge;

    console.log("auth", expectedChallenge);

    const devices = await DevicesService.getDevice(userId);

    let dbAuthenticator;
    const bodyCredIDBuffer = isoBase64URL.toBuffer(body.rawId);
    // "Query the DB" here for an authenticator matching `credentialID`
    for (const dev of devices) {
      if (isoUint8Array.areEqual(dev.credentialID, bodyCredIDBuffer)) {
        dbAuthenticator = dev;
        break;
      }
    }

    if (!dbAuthenticator) {
      return NextResponse.json(
        { message: "Authenticator is not registered with this site" },
        { status: 400 }
      );
    }

    let verification: VerifiedAuthenticationResponse;
    try {
      const opts: VerifyAuthenticationResponseOpts = {
        response: body,
        expectedChallenge: `${expectedChallenge}`,
        expectedOrigin,
        expectedRPID: rpID,
        authenticator: dbAuthenticator,
        requireUserVerification: false,
      };
      verification = await verifyAuthenticationResponse(opts);
    } catch (error) {
      const _error = error as Error;
      console.trace(_error);
      return NextResponse.json(
        { message: _error?.message || "Somethig went wrong" },
        { status: 500 }
      );
    }

    const { verified, authenticationInfo } = verification;

    if (verified) {
      // Update the authenticator's counter in the DB to the newest count in the authentication
      dbAuthenticator.counter = authenticationInfo.newCounter;
    }

    session.currentChallenge = undefined;
    await session.save();

    return NextResponse.json({ data: { verified } }, { status: 200 });
  } catch (error: any) {
    console.trace(error);
    return NextResponse.json(
      { message: error?.message || "Somethig went wrong" },
      { status: 500 }
    );
  }
}
