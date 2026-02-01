"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

/**
 * Project Context - Global project selection state
 *
 * Priority flow:
 * 1. URL param ?project=<id> (highest - enables shareable links)
 * 2. localStorage aiaiai.currentProject (session persistence)
 * 3. Default: "all" (show all projects)
 */

interface ProjectContextValue {
  currentProject: string; // project ID or "all"
  setCurrentProject: (projectId: string) => void;
  isLoading: boolean;
}

const ProjectContext = createContext<ProjectContextValue | undefined>(undefined);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [currentProject, setCurrentProjectState] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);

  // Initialize from URL or localStorage
  useEffect(() => {
    const urlProject = searchParams.get("project");

    if (urlProject) {
      // URL has priority
      setCurrentProjectState(urlProject);
      // Sync to localStorage
      localStorage.setItem("aiaiai.currentProject", urlProject);
    } else {
      // Fallback to localStorage
      const stored = localStorage.getItem("aiaiai.currentProject");
      const initialProject = stored || "all";
      setCurrentProjectState(initialProject);

      // Update URL to match
      const newParams = new URLSearchParams(searchParams);
      newParams.set("project", initialProject);
      router.replace(`${pathname}?${newParams.toString()}`, { scroll: false });
    }

    setIsLoading(false);
  }, [searchParams, router, pathname]);

  const setCurrentProject = (projectId: string) => {
    setCurrentProjectState(projectId);

    // Update localStorage
    localStorage.setItem("aiaiai.currentProject", projectId);

    // Update URL
    const newParams = new URLSearchParams(searchParams);
    newParams.set("project", projectId);
    router.push(`${pathname}?${newParams.toString()}`, { scroll: false });
  };

  return (
    <ProjectContext.Provider value={{ currentProject, setCurrentProject, isLoading }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error("useProject must be used within ProjectProvider");
  }
  return context;
}
