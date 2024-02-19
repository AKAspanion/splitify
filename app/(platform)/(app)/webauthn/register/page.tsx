import { AutoContainer } from "@/components/container/auto-container";
import { Header } from "@/components/container/header";
import { Suspense } from "react";
import Authn from "./authn";

const AuthnRegisterPage = () => {
  return (
    <AutoContainer
      header={<Header title="Biometric Authentication" backTo="/groups" />}
    >
      <Suspense>
        <Authn />
      </Suspense>
    </AutoContainer>
  );
};
export default AuthnRegisterPage;
