"use client";

import { Button } from "@/components/ui/button";
import { getMsalInstance, loginRequest } from "@/lib/msalConfig";

export function LoginButton() {
  const handleLogin = async () => {
    try {
      const msalInstance = getMsalInstance();
      // 🔑 Ensure MSAL is initialized
      await msalInstance.initialize();

      // Start login
      const loginResponse = await msalInstance.loginPopup(loginRequest);

      const account = loginResponse.account;
      msalInstance.setActiveAccount(account);

      // 🔐 Get access token
      const tokenResponse = await msalInstance.acquireTokenSilent({
        ...loginRequest,
        account,
      });

      const accessToken = tokenResponse.accessToken;
      console.log("Access token:", accessToken);

      // Optional: Send token to backend if needed
      // await fetch("/api/session", {
      //   method: "POST",
      //   headers: { Authorization: `Bearer ${accessToken}` },
      // });

      window.location.href = "/mail";
    } catch (error) {
      console.error("Login error:", error);
      alert("Login failed. Please try again.");
    }
  };

  return (
    <Button
      variant="outline"
      type="button"
      onClick={handleLogin}
      className="w-full"
    >
      Sign in with Microsoft
    </Button>
  );
}
