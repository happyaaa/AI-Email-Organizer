import { PublicClientApplication } from "@azure/msal-browser";

export const getMsalInstance = () => {
  const msalConfig = {
    auth: {
      clientId: "44b4a98b-3144-48f8-bc1e-5413975993e1",
      authority: "https://login.microsoftonline.com/common",  
      redirectUri: typeof window !== "undefined" ? window.location.origin : "",
      navigateToLoginRequestUrl: true,
      postLogoutRedirectUri: typeof window !== "undefined" ? window.location.origin : "",
    },
    cache: {
      cacheLocation: "sessionStorage",
      storeAuthStateInCookie: true
    },
  };

  return new PublicClientApplication(msalConfig);
};

export const loginRequest = {
  scopes: ["Mail.Read", "Mail.ReadWrite", "Mail.Send", "User.Read"],
  prompt: "select_account", 
};
