"use client";

import { Button } from "@/components/ui/button";
import { config } from "@/config";

export function LoginButton() {
  const handleLogin = async () => {
    try {
      // Get the auth URL from our backend
      const response = await fetch(`${config.api.baseUrl}/api/auth/login`, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Use window.location.replace instead of href for better security
      window.location.replace(data.url);
    } catch (error) {
      console.error("Login failed:", error);
      alert("Failed to start login process. Please try again.");
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
