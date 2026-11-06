import { Suspense } from "react";
import { AuthCard } from "../_components/auth-card";
import { SignUpForm } from "./sign-up-form";

const SignUpPage = () => {
  // The form reads the query, so it renders in the browser only; the card around it (same subtitle as the form's) is in
  // the prerendered page.
  return (
    <Suspense
      fallback={<AuthCard subtitle="Create your account">{null}</AuthCard>}
    >
      <SignUpForm />
    </Suspense>
  );
};

export default SignUpPage;
