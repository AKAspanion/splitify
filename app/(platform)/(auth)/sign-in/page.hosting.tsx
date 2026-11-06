import { Suspense } from "react";
import { AuthCard } from "../_components/auth-card";
import { SignInForm } from "./sign-in-form";

const SignInPage = () => {
  // The form reads the query, so it renders in the browser only; the card around it (same subtitle as the form's) is in
  // the prerendered page.
  return (
    <Suspense
      fallback={
        <AuthCard subtitle="Sign in to split expenses with friends">
          {null}
        </AuthCard>
      }
    >
      <SignInForm />
    </Suspense>
  );
};

export default SignInPage;
