import { AutoContainer } from "@/components/container/auto-container";
import { Header } from "@/components/container/header";
import dynamic from "next/dynamic";
import { ScreenSkeleton } from "@/app/(platform)/(app)/_components/screen-skeleton";

const AuthnRegister = dynamic(() => import("./authn-register"), {
  loading: () => <ScreenSkeleton />,
});

const AuthnRegisterPage = () => {
  return (
    <AutoContainer
      header={<Header title="Biometric Authentication" backTo="/groups" />}
    >
      <AuthnRegister />
    </AutoContainer>
  );
};
export default AuthnRegisterPage;
