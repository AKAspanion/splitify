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
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

const rpID = process.env.AUTHN_RP_ID || "splitify.spanion.in";
const expectedOrigin =
  process.env.AUTHN_EXPECTED_ORIGIN || "https://splitify.spanion.in";
export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body: RegistrationResponseJSON = await req.json();

    const session = await getIronSession<{ currentChallenge?: string }>(
      await cookies(),
      {
        password: "supersecretamazingpassword123456",
        cookieName: "challenge",
      },
    );
    const expectedChallenge = session.currentChallenge;

    let verification: VerifiedRegistrationResponse;
    try {
      const opts: VerifyRegistrationResponseOpts = {
        response: body,
        expectedChallenge: `${expectedChallenge}`,
        expectedOrigin,
        expectedRPID: rpID,
        requireUserVerification: false,
      };
      verification = await verifyRegistrationResponse(opts);
    } catch (error) {
      const _error = error as Error;
      console.trace(error);
      return NextResponse.json(
        { message: _error?.message || "Something went wrong" },
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
        DevicesService.pushDevice(userId, newDevice);
      }
    }

    session.currentChallenge = undefined;
    await session.save();

    return NextResponse.json({ data: { verified } }, { status: 200 });
  } catch (error: any) {
    console.trace(error);
    return NextResponse.json(
      { message: error?.message || "Something went wrong" },
      { status: 500 },
    );
  }
}
