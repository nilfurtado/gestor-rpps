"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface LogoContextValue {
  logoSrc: string | null;
  refreshLogo: () => void;
}

const LogoContext = createContext<LogoContextValue>({
  logoSrc: null,
  refreshLogo: () => {},
});

export function LogoProvider({
  initialLogoPath,
  children,
}: {
  initialLogoPath: string | null;
  children: ReactNode;
}) {
  const [version, setVersion] = useState(0);
  const logoSrc = initialLogoPath
    ? version > 0
      ? `${initialLogoPath}?v=${version}`
      : initialLogoPath
    : null;

  function refreshLogo() {
    setVersion(Date.now());
  }

  return (
    <LogoContext.Provider value={{ logoSrc, refreshLogo }}>
      {children}
    </LogoContext.Provider>
  );
}

export function useLogo() {
  return useContext(LogoContext);
}
