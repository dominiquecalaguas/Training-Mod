"use client";

const STORAGE_KEY = "trainingmod_device_token";

function generateToken() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

export function getOrCreateDeviceToken(): string {
  if (typeof window === "undefined") {
    throw new Error("getOrCreateDeviceToken must be called on the client");
  }

  const existing = window.localStorage.getItem(STORAGE_KEY);
  if (existing) return existing;

  const token = generateToken();
  window.localStorage.setItem(STORAGE_KEY, token);
  return token;
}

