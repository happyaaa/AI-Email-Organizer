import { PublicClientApplication } from "@azure/msal-browser";

const msalConfig = {
  auth: {
    clientId: "44b4a98b-3144-48f8-bc1e-5413975993e1",
    authority: "https://login.microsoftonline.com/44467e6f-462c-4ea2-823f-7800de5434e3",
    redirectUri: typeof window !== "undefined" ? window.location.origin : "",
  },
};

export const getMsalInstance = () => {
  const msalConfig = {
    auth: {
      clientId: "44b4a98b-3144-48f8-bc1e-5413975993e1",
      authority: "https://login.microsoftonline.com/44467e6f-462c-4ea2-823f-7800de5434e3",
      redirectUri: typeof window !== "undefined" ? window.location.origin : "", // prevent SSR crash
    },
  };

  return new PublicClientApplication(msalConfig);
};

export const loginRequest = {
  scopes: ["Mail.Read", "Mail.ReadWrite", "Mail.Send", "User.Read"],
};
