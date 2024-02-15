"use client";
import { auth, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

import axios from "axios";

const handleDeviceRegistration = async () => {
  const email = localStorage.getItem("email") || "";
  try {
    const { data: credentialCreationOptions } = await axios.post(
      `/api/webauthn/get-reg-device-options`,
      {
        email,
      },
    );
  } catch (error) {
    alert("oopsie!! an error occured during registration");
  }
};

export default function App() {
  const { user } = useUser();
  const router = useRouter();
  const handleWebauthnRegistration = async () => {
    const isSuccessful = await handleDeviceRegistration();
    // isSuccessful && router.push("login");
  };
  return (
    <div className="App grid_txt_1">
      <h1>
        Register device for{" "}
        <span className="col-gold"> &lt; {user?.fullName}&gt; </span>{" "}
      </h1>
      <div className="u-center">
        <button className="btn br" onClick={handleWebauthnRegistration}>
          register device
        </button>
      </div>
    </div>
  );
}
