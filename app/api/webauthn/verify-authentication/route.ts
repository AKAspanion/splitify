import { NextResponse } from "next/server";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import type {
  AuthenticationResponseJSON,
  VerifiedAuthenticationResponse,
  VerifyAuthenticationResponseOpts,
} from "@simplewebauthn/server";
import { auth } from "@clerk/nextjs/server";
import DevicesService from "@/lib/auth/service/devices";
import { getChallengeSession } from "@/lib/auth/session";

const rpID = process.env.AUTHN_RP_ID || "splitify.spanion.in";
const expectedOrigin =
  process.env.AUTHN_EXPECTED_ORIGIN || "https://splitify.spanion.in";
export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const session = await getChallengeSession();
    const expectedChallenge = session.currentChallenge;

    if (!expectedChallenge) {
      return NextResponse.json(
        { message: "No authentication in progress" },
        { status: 400 },
      );
    }

    const body: AuthenticationResponseJSON = await req.json();

    const devices = await DevicesService.getDevice(userId);

    // "Query the DB" here for an authenticator matching `credentialID`
    const dbAuthenticator = devices.find((dev) => dev.id === body.rawId);

    if (!dbAuthenticator) {
      return NextResponse.json(
        { message: "Authenticator is not registered with this site" },
        { status: 400 },
      );
    }

    let verification: VerifiedAuthenticationResponse;
    try {
      const opts: VerifyAuthenticationResponseOpts = {
        response: body,
        expectedChallenge,
        expectedOrigin,
        expectedRPID: rpID,
        credential: dbAuthenticator,
        requireUserVerification: false,
      };
      verification = await verifyAuthenticationResponse(opts);
    } catch (error) {
      console.trace(error);
      return NextResponse.json(
        { message: "Something went wrong" },
        { status: 500 },
      );
    }

    const { verified, authenticationInfo } = verification;

    if (verified) {
      // Save the newest counter, so a cloned authenticator that replays an older one is caught next time
      await DevicesService.updateCounter(
        userId,
        dbAuthenticator.id,
        authenticationInfo.newCounter,
      );
    }

    session.currentChallenge = undefined;
    await session.save();

    return NextResponse.json({ data: { verified } }, { status: 200 });
  } catch (error) {
    console.trace(error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 },
    );
  }
}
