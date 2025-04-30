import { PublicClientApplication } from "@azure/msal-browser";

export const getMsalInstance = () => {
  const msalConfig = {
    auth: {
      clientId: "990298d9-b3c0-4096-b31c-15c19aa209bb",
      authority: "https://login.microsoftonline.com/44467e6f-462c-4ea2-823f-7800de5434e3",
      redirectUri: typeof window !== "undefined" ? window.location.origin : "", // prevent SSR crash
    },
  };

  return new PublicClientApplication(msalConfig);
};

export const loginRequest = {
  scopes: ["Mail.Read", "Mail.ReadWrite", "Mail.Send", "User.Read"],
};
