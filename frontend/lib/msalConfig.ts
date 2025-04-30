import { PublicClientApplication } from "@azure/msal-browser";

export const getMsalInstance = () => {
  const msalConfig = {
    auth: {
      clientId: "9a869dc0-4402-432e-951c-9a8509a68aef",
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
