"use client";

import { Dispatch, SetStateAction, useEffect, useState } from "react";
import {
  startAuthentication,
  startRegistration,
  browserSupportsWebAuthn,
} from "@simplewebauthn/browser";

import "./authn.css";

export const Authn = () => {
  const [regDebug, setReqDebug] = useState("");
  const [authDebug, setAuthDebug] = useState("");
  const [elemError, setElemError] = useState("");
  const [elemSuccess, setElemSuccess] = useState("");

  const reset = () => {
    setElemError("");
    setElemSuccess("");
  };

  const printDebug = (
    setter: Dispatch<SetStateAction<string>>,
    title: string,
    output = ""
  ) => {
    setter((d) => (d += "\n"));
    setter((d) => (d += `// ${title}\n`));
    setter((d) => (d += `${output}\n`));
  };

  const register = async () => {
    reset();
    setReqDebug("");

    const resp = await fetch("/api/webauthn/generate-registration-options");

    let attResp;
    try {
      const { data } = await resp.json();

      printDebug(
        setReqDebug,
        "Registration Options",
        JSON.stringify(data, null, 2)
      );

      // hideAuthForm();

      attResp = await startRegistration(data);
      printDebug(
        setReqDebug,
        "Registration Response",
        JSON.stringify(attResp, null, 2)
      );
    } catch (e) {
      const error = e as Error;
      if (error.name === "InvalidStateError") {
        printDebug(
          setElemError,
          "Error: Authenticator was probably already registered by user"
        );
      } else {
        printDebug(setElemError, error.message);
      }

      throw error;
    }

    const verificationResp = await fetch("/api/webauthn/verify-registration", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(attResp),
    });

    const { data: verificationJSON } = await verificationResp.json();
    printDebug(
      setReqDebug,
      "Server Response",
      JSON.stringify(verificationJSON, null, 2)
    );

    if (verificationJSON && verificationJSON.verified) {
      printDebug(setElemSuccess, `Authenticator registered!`);
    } else {
      printDebug(
        setElemError,
        `Oh no, something went wrong!`,
        JSON.stringify(verificationJSON)
      );
    }
  };

  const begin = async () => {
    reset();
    setAuthDebug("");

    const resp = await fetch("/api/webauthn/generate-authentication-options");

    let asseResp;
    try {
      const { data } = await resp.json();
      printDebug(
        setAuthDebug,
        "Authentication Options",
        JSON.stringify(data, null, 2)
      );

      // hideAuthForm();

      asseResp = await startAuthentication(data);
      printDebug(
        setAuthDebug,
        "Authentication Response",
        JSON.stringify(asseResp, null, 2)
      );
    } catch (e) {
      const error = e as Error;
      setElemError(error.message);
      throw new Error(error.message);
    }

    const verificationResp = await fetch(
      "/api/webauthn/verify-authentication",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(asseResp),
      }
    );

    const { data: verificationJSON } = await verificationResp.json();
    printDebug(
      setAuthDebug,
      "Server Response",
      JSON.stringify(verificationJSON, null, 2)
    );

    if (verificationJSON && verificationJSON.verified) {
      printDebug(setElemSuccess, `User authenticated!`);
    } else {
      printDebug(
        setElemError,
        `Oh no, something went wrong!`,
        JSON.stringify(verificationJSON)
      );
    }
  };

  const setup = async () => {
    /**
     * Conditional UI test
     *
     * 1. Start Chrome Canary 105+ with the requisite Conditional UI flag:
     *
     * open -a /Applications/Google\ Chrome\ Canary.app --args --enable-features=WebAuthenticationConditionalUI
     *
     * 2. Create an entry in chrome://settings/passwords (temporary requirement) e.g.:
     *
     *   - Site: https://example.simplewebauthn.dev/
     *   - Username: user@example.simplewebauthn.dev
     *   - Password: whatever
     *
     * 3. Register a credential
     *
     * 4. Reload the page
     *
     * 5. Interact with the username field above the Authenticate button
     *
     * Notes:
     *
     * I'm currently trying to get to calling WebAuthn as fast as I can here, there's a
     * Chrome race condition with autofill that sometimes prevents a credential from appearing.
     *
     * See: https://bugs.chromium.org/p/chromium/issues/detail?id=1322967&q=component%3ABlink%3EWebAuthentication&can=2
     *
     * I've been assured this race condition is temporary, at which point we'll probably be able
     * to include this just before </body> as we'd typically do. And at that point we can
     * probably use async/await as well for more sane-looking code.
     */
    fetch("/api/webauthn/generate-authentication-options")
      .then((resp) => resp.json())
      .then(({ data }) => {
        console.log("Authentication Options (Autofill)", data);
        startAuthentication(data, true)
          .then(async (asseResp) => {
            // We can assume the DOM has loaded by now because it had to for the user to be able
            // to interact with an input to choose a credential from the autofill
            // const elemSuccess = document.querySelector("#authSuccess");
            // const elemError = document.querySelector("#authError");

            printDebug(
              setAuthDebug,
              "Authentication Response (Autofill)",
              JSON.stringify(asseResp, null, 2)
            );

            const verificationResp = await fetch(
              "/api/webauthn/verify-authentication",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(asseResp),
              }
            );

            const { data: verificationJSON } = await verificationResp.json();
            printDebug(
              setAuthDebug,
              "Server Response (Autofill)",
              JSON.stringify(verificationJSON, null, 2)
            );

            if (verificationJSON && verificationJSON.verified) {
              printDebug(setElemSuccess, `User authenticated!`);
            } else {
              printDebug(
                setElemError,
                `Oh no, something went wrong!`,
                JSON.stringify(verificationJSON)
              );
            }
          })
          .catch((err) => {
            console.error("(Autofill)", err);
          });
      });
  };

  useEffect(() => {
    setup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div className="controls">
        <section id="registration">
          <button id="btnRegBegin" onClick={() => register()}>
            <strong>🚪&nbsp;Register</strong>
          </button>
          <p id="regSuccess" className="success"></p>
          <p id="regError" className="error"></p>
          <details open>
            <summary>Console</summary>
            <pre id="regDebug" spellCheck="false">
              {regDebug}
            </pre>
          </details>
        </section>

        <section id="authentication">
          <form
            onSubmit={(event) => {
              event.preventDefault();
            }}
          >
            <button type="button" id="btnAuthBegin" onClick={() => begin()}>
              <strong>🔐&nbsp;Authenticate</strong>
            </button>
          </form>
          <p id="authSuccess" className="success">
            {elemSuccess}
          </p>
          <p id="authError" className="error">
            {elemError}
          </p>
          <details open>
            <summary>Console</summary>
            <pre id="regDebug" spellCheck="false">
              {authDebug}
            </pre>
          </details>
        </section>
      </div>

      <p className="systemError"></p>
    </div>
  );
};
