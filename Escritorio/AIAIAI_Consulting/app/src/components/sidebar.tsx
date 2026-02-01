"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useProject } from "@/contexts/project-context";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { MiniAgentMonitor } from "@/components/mini-agent-monitor";
import { toast } from "sonner";

const navItems = [
  { href: "/", label: "Dashboard", icon: "~" },
  { href: "/projects", label: "Projects", icon: "#" },
  { href: "/command", label: "Command", icon: "▐" },
  { href: "/tokens", label: "Tokens", icon: "$" },
  { href: "/analytics", label: "Analytics", icon: "^" },
  { href: "/quality", label: "Quality", icon: "%" },
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

    fetch(`/data/projects.json`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load project info");
        return res.json();
      })
      .then((projects) => {
        const project = projects.find((p: { id: string }) => p.id === projectId);
        if (project) {
          setProjectInfo({ name: project.name, status: project.status });
        }
      })
      .catch((err) => {
        console.error("Project info error:", err);
        toast.error("Failed to load project details");
        setProjectInfo({ name: projectId, status: "active" });
      });
  }, [projectId]);

  if (!projectInfo) {
    return null;
  }

  const statusColors = {
    active: "bg-green-500/20 text-green-400 border-green-400",
    paused: "bg-yellow-500/20 text-yellow-400 border-yellow-400",
    completed: "bg-cyan-500/20 text-cyan-400 border-cyan-400",
  };

  return (
    <div className="px-3 py-2 mb-2">
      <Badge
        variant="outline"
        className={`${statusColors[projectInfo.status]} text-xs font-mono uppercase tracking-wider truncate max-w-full border-2`}
      >
        ▸ {projectInfo.name}
      </Badge>
    </div>
  );
}

interface SidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ mobileOpen = false, onClose }: SidebarProps = {}) {
  const pathname = usePathname();
  const { currentProject } = useProject();

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  const handleLinkClick = () => {
    // Close mobile menu when navigating
    if (onClose) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile overlay backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside className={`
        w-64 shrink-0 border-r-2 border-cyan-400 bg-black text-white p-0 flex flex-col
        fixed lg:sticky top-0 h-screen z-50
        transition-transform duration-300 ease-out
        ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
      {/* Header */}
      <div className="p-4 border-b-2 border-cyan-400">
        <div className="font-bold text-2xl text-cyan-400 tracking-widest font-[family-name:var(--font-space)] animate-text-glow">
          AIAIAI
        </div>
        <div className="text-xs text-gray-500 uppercase tracking-wider mt-1 font-[family-name:var(--font-jetbrains)]">
          CONSULTING OS
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col flex-1 p-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={handleLinkClick}
            className={`
              flex items-center gap-3 px-4 py-3 text-sm transition-all relative
              uppercase tracking-widest font-[family-name:var(--font-jetbrains)]
              ${
                isActive(item.href)
                  ? "bg-green-950/20 text-green-400 border-l-4 border-green-400"
                  : "text-gray-400 hover:bg-zinc-950 hover:text-white border-l-4 border-transparent"
              }
            `}
          >
            <span className="w-6 text-center text-base">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Project Badge */}
      <ProjectBadge projectId={currentProject} />

      {/* Mini Agent Monitor */}
      <MiniAgentMonitor />

      {/* Bottom Navigation */}
      <div className="border-t-2 border-gray-800 p-2 mt-auto">
        {bottomNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={handleLinkClick}
            className={`
              flex items-center gap-3 px-4 py-3 text-sm transition-all relative
              uppercase tracking-widest font-[family-name:var(--font-jetbrains)]
              ${
                isActive(item.href)
                  ? "bg-purple-950/20 text-purple-400 border-l-4 border-purple-400"
                  : "text-gray-400 hover:bg-zinc-950 hover:text-white border-l-4 border-transparent"
              }
            `}
          >
            <span className="w-6 text-center text-base">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </div>
    </aside>
    </>
  );
}
