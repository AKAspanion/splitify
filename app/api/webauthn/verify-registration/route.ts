import { NextResponse } from "next/server";
import { verifyRegistrationResponse } from "@simplewebauthn/server";
import type {
  RegistrationResponseJSON,
  VerifiedRegistrationResponse,
  VerifyRegistrationResponseOpts,
  WebAuthnCredential,
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
        { message: "No registration in progress" },
        { status: 400 },
      );
    }

    const body: RegistrationResponseJSON = await req.json();

    let verification: VerifiedRegistrationResponse;
    try {
      const opts: VerifyRegistrationResponseOpts = {
        response: body,
        expectedChallenge,
        expectedOrigin,
        expectedRPID: rpID,
        requireUserVerification: false,
      };
      verification = await verifyRegistrationResponse(opts);
    } catch (error) {
      console.trace(error);
      return NextResponse.json(
        { message: "Registration could not be verified" },
        { status: 400 },
      );
    }

    const { verified, registrationInfo } = verification;

    if (verified && registrationInfo) {
      const { credential } = registrationInfo;

      const devices = await DevicesService.getDevice(userId);
      const existingDevice = devices.find(
        (device) => device.id === credential.id,
      );

      if (!existingDevice) {
        /**
         * Add the returned device to the user's list of devices
         */
        const newDevice: WebAuthnCredential = {
          id: credential.id,
          publicKey: credential.publicKey,
          counter: credential.counter,
          transports: body.response.transports,
        };
        await DevicesService.pushDevice(userId, newDevice);
      }
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
