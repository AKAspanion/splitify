import { Suspense } from "react";
import { Header } from "@/components/container/header";
import { SignInForm } from "./sign-in-form";

const SignInPage = () => {
  return (
    <div className="flex flex-col items-center">
      <div className="p-6 w-full">
        <Header backTo="/" title="Sign in" />
      </div>
      <div className="flex w-full justify-center px-6 pb-12">
        <Suspense>
          <SignInForm />
        </Suspense>
      </div>
    </div>
  );
};

export default SignInPage;
