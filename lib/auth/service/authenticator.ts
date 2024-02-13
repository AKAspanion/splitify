import { readFileSync, writeFileSync } from "fs";
import path from "path";

type AuthenticatorType = {
  credentialID: Uint8Array | Array<any>;
  credentialPublicKey: Uint8Array | Array<any>;
  counter: string;
};

type SingleUserAuthenticator = {
  userId: string;
  authenticators: AuthenticatorType[];
};

export const CollectionOfUserAuthenticators: Array<SingleUserAuthenticator> =
  [];
export const AuthenticatorsService = {
  getCollectionOfUserAuthenticators() {
    return JSON.parse(
      readFileSync("users-authenticators.json", "utf-8")
    ) as SingleUserAuthenticator[];
  },
  getUserAuthenticatorsIndex(userId: string) {},
  getUserAuthenticators(userId: string) {},
  async storeUserAuthenticator(
    userId: string,
    newAuthenticator: AuthenticatorType
  ) {},
  getAuthenticatorByCredentialId(
    userAuthenticators: AuthenticatorType[],
    autheticatorCredentialIdB64URL: string
  ) {},
};
