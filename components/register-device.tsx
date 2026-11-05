"use client";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { callFunction } from "@/lib/functions/call";

const handleDeviceRegistration = async () => {
  const email = localStorage.getItem("email") || "";
  try {
    await callFunction(`/api/webauthn/get-reg-device-options`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
  } catch (error) {
    alert("oopsie!! an error occured during registration");
  }
};

export default function App() {
  const { user } = useAuth();
  const router = useRouter();
  const handleWebauthnRegistration = async () => {
    const isSuccessful = await handleDeviceRegistration();
    // isSuccessful && router.push("login");
  };
  return (
    <div className="App grid_txt_1">
      <h1>
        Register device for{" "}
        <span className="col-gold"> &lt; {user?.name}&gt; </span>{" "}
      </h1>
      <div className="u-center">
        <button className="btn br" onClick={handleWebauthnRegistration}>
          register device
        </button>
      </div>
    </div>
  );
}
