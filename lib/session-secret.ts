export const sessionIssuer = "fitness-app";
export const sessionAudience = "fitness-app-client";

export function getSessionSecret() {
  const value = process.env.SESSION_SECRET;

  if (!value || value.length < 32) {
    throw new Error("SESSION_SECRET must be configured with at least 32 characters.");
  }

  return new TextEncoder().encode(value);
}
