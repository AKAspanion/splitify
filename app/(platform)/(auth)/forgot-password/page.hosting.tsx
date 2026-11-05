import { Header } from "@/components/container/header";
import { ForgotPasswordForm } from "./forgot-password-form";

const ForgotPasswordPage = () => {
  return (
    <div className="flex flex-col items-center">
      <div className="p-6 w-full">
        <Header backTo="/sign-in/" title="Reset your password" />
      </div>
      <div className="flex w-full justify-center px-6 pb-12">
        <ForgotPasswordForm />
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
