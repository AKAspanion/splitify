import DevicesService from "@/lib/auth/service/devices";
import { auth } from "@clerk/nextjs";
import {
  GenerateAuthenticationOptionsOpts,
  generateAuthenticationOptions,
} from "@simplewebauthn/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const rpID = process.env.AUTHN_RP_ID;
export async function GET(_req: Request) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const devices = await DevicesService.getDevice(userId);

    const opts: GenerateAuthenticationOptionsOpts = {
      timeout: 60000,
      allowCredentials: devices.map((dev) => ({
        id: dev.credentialID,
        type: "public-key",
        transports: dev.transports,
      })),
      /**
       * Wondering why user verification isn't required? See here:
       *
       * https://passkeys.dev/docs/use-cases/bootstrapping/#a-note-about-user-verification
       */
      userVerification: "preferred",
      rpID,
    };

    const data = await generateAuthenticationOptions(opts);

    const session = await getIronSession<{ currentChallenge?: string }>(
      cookies(),
      { password: "supersecretamazingpassword123456", cookieName: "challenge" }
    );
    session.currentChallenge = data?.challenge;
    await session.save();

    return NextResponse.json({ data }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message || "Somethig went wrong" },
      { status: 500 }
    );
  }
}
