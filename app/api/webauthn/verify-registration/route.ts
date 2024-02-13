import { NextResponse } from "next/server";
import { verifyRegistrationResponse } from "@simplewebauthn/server";
import type {
  VerifiedRegistrationResponse,
  VerifyRegistrationResponseOpts,
} from "@simplewebauthn/server";
import { isoBase64URL, isoUint8Array } from "@simplewebauthn/server/helpers";
import type {
  AuthenticatorDevice,
  RegistrationResponseJSON,
} from "@simplewebauthn/types";
import { NextApiRequest } from "next";
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

    const body: RegistrationResponseJSON = await req.json();

    const session = await getIronSession<{ currentChallenge?: string }>(
      cookies(),
      { password: "supersecretamazingpassword123456", cookieName: "challenge" }
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
        { message: _error?.message || "Somethig went wrong" },
        { status: 400 }
      );
    }

    const { verified, registrationInfo } = verification;

    if (verified && registrationInfo) {
      const { credentialPublicKey, credentialID, counter } = registrationInfo;

      const devices = await DevicesService.getDevice(userId);
      const existingDevice = devices.find((device) =>
        isoUint8Array.areEqual(device.credentialID, credentialID)
      );

      if (!existingDevice) {
        /**
         * Add the returned device to the user's list of devices
         */
        const newDevice: AuthenticatorDevice = {
          credentialPublicKey,
          credentialID,
          counter,
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
      { message: error?.message || "Somethig went wrong" },
      { status: 500 }
    );
  }
}
