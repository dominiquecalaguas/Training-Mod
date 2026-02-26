"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { getOrCreateDeviceToken } from "@//lib/deviceToken";

type DeviceTokenContextValue = string | null;

const DeviceTokenContext = createContext<DeviceTokenContextValue>(null);

export function useDeviceToken() {
  const ctx = useContext(DeviceTokenContext);
  if (ctx == null) {
    throw new Error("useDeviceToken must be used within DeviceTokenProvider");
  }
  return ctx;
}

export function DeviceTokenProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const t = getOrCreateDeviceToken();
    queueMicrotask(() => setToken(t));
  }, []);

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 text-zinc-600">
        Loading…
      </div>
    );
  }

  return (
    <DeviceTokenContext.Provider value={token}>
      {children}
    </DeviceTokenContext.Provider>
  );
}

