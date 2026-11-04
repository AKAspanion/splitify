import DevicesService from "@/lib/auth/service/devices";
import { getChallengeSession } from "@/lib/auth/session";
import { auth } from "@clerk/nextjs/server";
import {
  GenerateAuthenticationOptionsOpts,
  generateAuthenticationOptions,
} from "@simplewebauthn/server";
import { NextResponse } from "next/server";

const rpID = process.env.AUTHN_RP_ID || "splitify.spanion.in";
export async function GET(_req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const devices = await DevicesService.getDevice(userId);

    const opts: GenerateAuthenticationOptionsOpts = {
      timeout: 60000,
      allowCredentials: devices.map((dev) => ({
        id: dev.id,
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

    const session = await getChallengeSession();
    session.currentChallenge = data?.challenge;
    await session.save();

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error("generate-authentication-options failed", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 },
    );
  }
}
