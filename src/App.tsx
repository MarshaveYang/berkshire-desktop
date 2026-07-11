import { useEffect, useState } from "react";
import { useAppStore } from "./lib/store";
import { api } from "./lib/api";
import LoginScreen from "./components/LoginScreen";
import Desktop from "./components/Desktop";

export default function App() {
  const authenticated = useAppStore((s) => s.authenticated);
  const setAuthenticated = useAppStore((s) => s.setAuthenticated);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    api
      .me()
      .then(() => setAuthenticated(true))
      .catch(() => setAuthenticated(false))
      .finally(() => setChecking(false));
  }, [setAuthenticated]);

  if (checking || authenticated === null) {
    return <div className="w-screen h-screen desktop-wallpaper" />;
  }

  return authenticated ? <Desktop /> : <LoginScreen />;
}
