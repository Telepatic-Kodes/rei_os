"use client";

import { useProject } from "@/contexts/project-context";
import { useState, useEffect, useRef } from "react";
import type { Project } from "@/lib/schemas";

export function ProjectSelector() {
  const { currentProject, setCurrentProject } = useProject();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [currentProjectName, setCurrentProjectName] = useState("Todos los Proyectos");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load projects
  useEffect(() => {
    fetch("/data/projects.json")
      .then((res) => res.json())
      .then((data: Project[]) => {
        setProjects(data);

        // Update current project name
        if (currentProject === "all") {
          setCurrentProjectName("Todos los Proyectos");
        } else {
          const project = data.find((p) => p.id === currentProject);
          setCurrentProjectName(project?.name || currentProject);
        }
      })
      .catch(console.error);
  }, [currentProject]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Group projects by status
  const groupedProjects = {
    active: projects.filter((p) => p.status === "active"),
    paused: projects.filter((p) => p.status === "paused"),
    completed: projects.filter((p) => p.status === "completed"),
  };

  const handleSelect = (projectId: string) => {
    setCurrentProject(projectId);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-background border border-border rounded-md hover:bg-accent transition-colors text-sm"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="font-mono text-muted-foreground">#</span>
        <span>{currentProjectName}</span>
        <span className="ml-2 text-muted-foreground">{isOpen ? "▲" : "▼"}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-popover border border-border rounded-md shadow-lg z-50 max-h-96 overflow-y-auto">
          {/* All Projects Option */}
          <button
            onClick={() => handleSelect("all")}
            className={`w-full text-left px-4 py-2 hover:bg-accent transition-colors text-sm ${
              currentProject === "all" ? "bg-accent text-accent-foreground" : ""
            }`}
          >
            <div className="font-mono text-muted-foreground inline-block mr-2">~</div>
            Todos los Proyectos
          </button>

          <div className="border-t border-border my-1" />

          {/* Active Projects */}
          {groupedProjects.active.length > 0 && (
            <>
              <div className="px-4 py-2 text-xs text-muted-foreground font-semibold uppercase">
                Activos
              </div>
              {groupedProjects.active.map((project) => (
                <button
                  key={project.id}
                  onClick={() => handleSelect(project.id)}
                  className={`w-full text-left px-4 py-2 hover:bg-accent transition-colors text-sm ${
                    currentProject === project.id ? "bg-accent text-accent-foreground" : ""
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="truncate">{project.name}</span>
                  </div>
                  <div className="text-xs text-muted-foreground ml-4">
                    {project.progress}% · {project.tasksDone}/{project.tasksTotal} tasks
                  </div>
                </button>
              ))}
            </>
          )}

          {/* Paused Projects */}
          {groupedProjects.paused.length > 0 && (
            <>
              <div className="px-4 py-2 text-xs text-muted-foreground font-semibold uppercase mt-2">
                Pausados
              </div>
              {groupedProjects.paused.map((project) => (
                <button
                  key={project.id}
                  onClick={() => handleSelect(project.id)}
                  className={`w-full text-left px-4 py-2 hover:bg-accent transition-colors text-sm ${
                    currentProject === project.id ? "bg-accent text-accent-foreground" : ""
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-yellow-500" />
                    <span className="truncate">{project.name}</span>
                  </div>
                  <div className="text-xs text-muted-foreground ml-4">
                    {project.progress}% · Pausado
                  </div>
                </button>
              ))}
            </>
          )}

          {/* Completed Projects */}
          {groupedProjects.completed.length > 0 && (
            <>
              <div className="px-4 py-2 text-xs text-muted-foreground font-semibold uppercase mt-2">
                Completados
              </div>
              {groupedProjects.completed.map((project) => (
                <button
                  key={project.id}
                  onClick={() => handleSelect(project.id)}
                  className={`w-full text-left px-4 py-2 hover:bg-accent transition-colors text-sm ${
                    currentProject === project.id ? "bg-accent text-accent-foreground" : ""
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="truncate">{project.name}</span>
                  </div>
                  <div className="text-xs text-muted-foreground ml-4">
                    100% · {project.client}
                  </div>
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
