import { useEffect, useState } from "react";
import { useAppStore } from "./lib/store";
import { api } from "./lib/api";
import { useViewportHeightFix } from "./lib/useViewportHeightFix";
import LoginScreen from "./components/LoginScreen";
import Desktop from "./components/Desktop";

export default function App() {
  useViewportHeightFix();

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
    return <div className="app-viewport desktop-wallpaper" />;
  }

  return authenticated ? <Desktop /> : <LoginScreen />;
}
