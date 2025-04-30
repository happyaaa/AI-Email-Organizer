import { PublicClientApplication } from "@azure/msal-browser";

export const getMsalInstance = () => {
  const msalConfig = {
    auth: {
      clientId: "990298d9-b3c0-4096-b31c-15c19aa209bb",
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
