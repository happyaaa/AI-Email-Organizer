import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import {getMsalInstance, loginRequest} from "@/lib/msalConfig";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function authorizedFetch(input: RequestInfo, init: RequestInit = {}) {
  const msalInstance = getMsalInstance();
  await msalInstance.initialize();
  // 🔑 Ensure MSAL is initialized
  const account = msalInstance.getActiveAccount();
  if (!account) {
    throw new Error("No active account found. Please log in first.");
  }
  const tokenResponse = await msalInstance.acquireTokenSilent({
    ...loginRequest,
    account,
  });

  return fetch(input, {
    ...init,
    headers: {
      ...init.headers,
      Authorization: `Bearer ${tokenResponse.accessToken}`,
    },
  });
}