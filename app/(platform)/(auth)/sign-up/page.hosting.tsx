import { Suspense } from "react";
import { Header } from "@/components/container/header";
import { SignUpForm } from "./sign-up-form";

const SignUpPage = () => {
  return (
    <div className="flex flex-col items-center">
      <div className="p-6 w-full">
        <Header backTo="/" title="Sign up" />
      </div>
      <div className="flex w-full justify-center px-6 pb-12">
        <Suspense>
          <SignUpForm />
        </Suspense>
      </div>
    </div>
  );
};

export default SignUpPage;
