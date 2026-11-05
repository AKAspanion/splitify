import { Suspense } from "react";
import { ActionHandler } from "./action-handler";

/**
 * Where Firebase's email links land (reset password, verify email). The header is the handler's, since its title
 * depends on the link, which only the browser can read.
 */
const AuthActionPage = () => {
  return (
    <div className="flex flex-col items-center">
      <Suspense>
        <ActionHandler />
      </Suspense>
    </div>
  );
};

export default AuthActionPage;
