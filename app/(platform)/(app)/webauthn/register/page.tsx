import { AutoContainer } from "@/components/container/auto-container";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const AuthnRegisterPage = () => {
  return (
    <AutoContainer>
      <Link href={"/webauthn/test"}>
        <Button>Test</Button>
      </Link>
    </AutoContainer>
  );
};
export default AuthnRegisterPage;
