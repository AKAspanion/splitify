import { Suspense } from "react";
import { Authn } from "./authn";

const WebAuthnPage = () => {
  return (
    <div className="p-6">
      <Suspense>
        <Authn />
      </Suspense>
    </div>
  );
};

export default WebAuthnPage;
