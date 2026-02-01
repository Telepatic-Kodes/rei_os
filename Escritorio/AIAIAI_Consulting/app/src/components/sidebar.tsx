"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useProject } from "@/contexts/project-context";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";

const navItems = [
  { href: "/", label: "Resumen", icon: "~" },
  { href: "/projects", label: "Proyectos", icon: "#" },
  { href: "/command", label: "Command Center", icon: "▐" },
  { href: "/tokens", label: "Tokens", icon: "$" },
  { href: "/analytics", label: "Analytics", icon: "^" },
  { href: "/quality", label: "Calidad", icon: "%" },
  { href: "/kanban", label: "Kanban", icon: "=" },
];

const bottomNavItems = [{ href: "/settings", label: "Settings", icon: "*" }];

function ProjectBadge({ projectId }: { projectId: string }) {
  const [projectInfo, setProjectInfo] = useState<{
    name: string;
    status: "active" | "paused" | "completed";
  } | null>(null);

  useEffect(() => {
    if (projectId === "all") {
      setProjectInfo(null);
      return;
    }

    // Fetch project data from public API route
    fetch(`/data/projects.json`)
      .then((res) => res.json())
      .then((projects) => {
        const project = projects.find((p: { id: string }) => p.id === projectId);
        if (project) {
          setProjectInfo({ name: project.name, status: project.status });
        }
      })
      .catch(() => {
        // Fallback display
        setProjectInfo({ name: projectId, status: "active" });
      });
  }, [projectId]);

  if (!projectInfo) {
    return null;
  }

  const statusColors = {
    active: "bg-green-500/20 text-green-400 border-green-500/30",
    paused: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    completed: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  };

  return (
    <div className="px-3 py-2 mb-2">
      <Badge
        variant="outline"
        className={`${statusColors[projectInfo.status]} text-xs font-mono truncate max-w-full`}
      >
        {projectInfo.name}
      </Badge>
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { currentProject } = useProject();

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  return (
    <aside className="w-56 shrink-0 border-r bg-sidebar text-sidebar-foreground p-4 flex flex-col gap-1">
      <div className="font-bold text-lg mb-6 px-3">AIAIAI</div>
      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors relative ${
              isActive(item.href)
                ? "bg-sidebar-accent text-sidebar-accent-foreground before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-cyan-500"
                : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            }`}
          >
            <span className="font-mono text-muted-foreground w-4 text-center">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      <ProjectBadge projectId={currentProject} />

      <div className="border-t pt-2">
        {bottomNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors relative ${
              isActive(item.href)
                ? "bg-sidebar-accent text-sidebar-accent-foreground before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-cyan-500"
                : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            }`}
          >
            <span className="font-mono text-muted-foreground w-4 text-center">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </div>
    </aside>
  );
}
