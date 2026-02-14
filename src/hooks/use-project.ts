"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function useProject() {
  const project = useQuery(api.projects.getMyProject);
  return {
    project: project ?? null,
    projectId: project?._id ?? null,
    isLoading: project === undefined,
  };
}
