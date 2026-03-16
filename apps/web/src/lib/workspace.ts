"use client";

import { useEffect, useState } from "react";

export const workspaceRoles = [
  "admin",
  "finance",
  "reviewer",
  "auditor",
  "recipient",
] as const;

export type WorkspaceRole = (typeof workspaceRoles)[number];

export type WorkspaceProfile = {
  organizationSlug: string;
  organizationName: string;
  role: WorkspaceRole;
  displayName: string;
};

const defaultProfile: WorkspaceProfile = {
  organizationSlug: "north-star-dao",
  organizationName: "North Star DAO",
  role: "admin",
  displayName: "Treasury Admin",
};

const storageKey = "veilpay.workspace-profile";

export function useWorkspaceProfile() {
  const [profile, setProfile] = useState<WorkspaceProfile>(defaultProfile);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as WorkspaceProfile;
        setProfile(parsed);
      }
    } catch {
      // Keep the default profile when local storage is unavailable or corrupted.
    } finally {
      setHydrated(true);
    }
  }, []);

  function updateProfile(nextProfile: WorkspaceProfile) {
    setProfile(nextProfile);
    window.localStorage.setItem(storageKey, JSON.stringify(nextProfile));
  }

  return {
    profile,
    hydrated,
    updateProfile,
    permissions: {
      canApprove: profile.role === "admin" || profile.role === "finance" || profile.role === "reviewer",
      canShareDisclosure: profile.role === "admin" || profile.role === "finance" || profile.role === "auditor",
      canCreate: profile.role === "admin" || profile.role === "finance",
      canViewAudit: profile.role !== "recipient",
    },
  };
}
