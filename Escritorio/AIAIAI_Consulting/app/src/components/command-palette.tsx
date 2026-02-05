"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useProject } from "@/contexts/project-context";

interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  category: string;
  action: () => void;
  icon?: string;
  keywords?: string[];
}

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const { setCurrentProject } = useProject();

  // Define available commands
  const commands: CommandItem[] = [
    // Navigation
    {
      id: "nav-dashboard",
      title: "Dashboard",
      subtitle: "View overview",
      category: "Navigation",
      icon: "~",
      action: () => router.push("/"),
      keywords: ["home", "overview"]
    },
    {
      id: "nav-projects",
      title: "Projects",
      subtitle: "View all projects",
      category: "Navigation",
      icon: "#",
      action: () => router.push("/projects"),
      keywords: ["list"]
    },
    {
      id: "nav-command",
      title: "Command Center",
      subtitle: "Agent control",
      category: "Navigation",
      icon: "▐",
      action: () => router.push("/command"),
      keywords: ["agents", "executions"]
    },
    {
      id: "nav-tokens",
      title: "Tokens",
      subtitle: "Usage & budget",
      category: "Navigation",
      icon: "$",
      action: () => router.push("/tokens"),
      keywords: ["budget", "cost", "spending"]
    },
    {
      id: "nav-analytics",
      title: "Analytics",
      subtitle: "Spending trends",
      category: "Navigation",
      icon: "^",
      action: () => router.push("/analytics"),
      keywords: ["stats", "metrics", "trends"]
    },
    {
      id: "nav-quality",
      title: "Quality",
      subtitle: "Code metrics",
      category: "Navigation",
      icon: "%",
      action: () => router.push("/quality"),
      keywords: ["coverage", "tests", "lighthouse"]
    },
    {
      id: "nav-kanban",
      title: "Kanban",
      subtitle: "Task board",
      category: "Navigation",
      icon: "=",
      action: () => router.push("/kanban"),
      keywords: ["tasks", "board"]
    },
    {
      id: "nav-settings",
      title: "Settings",
      subtitle: "Configure app",
      category: "Navigation",
      icon: "*",
      action: () => router.push("/settings"),
      keywords: ["config", "preferences"]
    },
    // Project filters
    {
      id: "filter-all",
      title: "Show All Projects",
      category: "Filter",
      icon: "▣",
      action: () => setCurrentProject("all")
    },
    // Quick actions
    {
      id: "action-refresh",
      title: "Refresh Data",
      subtitle: "Reload from files",
      category: "Actions",
      icon: "↻",
      action: () => window.location.reload()
    }
  ];

  // Filter commands based on query
  const filteredCommands = query.trim()
    ? commands.filter((cmd) => {
        const searchText = `${cmd.title} ${cmd.subtitle} ${cmd.category} ${cmd.keywords?.join(" ")}`.toLowerCase();
        return searchText.includes(query.toLowerCase());
      })
    : commands;

  // Group by category
  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {} as Record<string, CommandItem[]>);

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Open/close with Ctrl+K or Cmd+K
    if ((e.ctrlKey || e.metaKey) && e.key === "k") {
      e.preventDefault();
      setIsOpen((prev) => !prev);
      return;
    }

    // Close with Escape
    if (e.key === "Escape" && isOpen) {
      setIsOpen(false);
      setQuery("");
      setSelectedIndex(0);
      return;
    }

    if (!isOpen) return;

    // Navigate with arrow keys
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, filteredCommands.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && filteredCommands[selectedIndex]) {
      e.preventDefault();
      executeCommand(filteredCommands[selectedIndex]);
    }
  }, [isOpen, filteredCommands, selectedIndex]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const executeCommand = (cmd: CommandItem) => {
    cmd.action();
    setIsOpen(false);
    setQuery("");
    setSelectedIndex(0);
  };

  if (!isOpen) return null;

  let commandIndex = 0;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-start justify-center pt-[20vh]">
      {/* Command Palette */}
      <div className="w-full max-w-2xl border-4 border-cyan-400 bg-black shadow-2xl animate-slide-in-right">
        {/* Header with overlapping label */}
        <div className="relative border-b-2 border-cyan-400 bg-zinc-950 p-4">
          <div className="absolute -top-3 left-4 bg-black px-2 text-cyan-400 text-xs tracking-widest font-[family-name:var(--font-jetbrains)]">
            ▐ COMMAND PALETTE ▌
          </div>

          {/* Search Input */}
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="TYPE COMMAND OR SEARCH..."
            autoFocus
            className="
              w-full bg-black border-2 border-gray-700 p-3
              text-white placeholder-gray-600 uppercase tracking-wide
              font-[family-name:var(--font-jetbrains)] text-sm
              focus:outline-none focus:border-cyan-400
            "
          />

          {/* Shortcut hint */}
          <div className="absolute top-4 right-4 text-xs text-gray-400 font-mono">
            ESC to close
          </div>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {Object.entries(groupedCommands).length === 0 ? (
            <div className="text-center py-12 text-gray-500 uppercase tracking-wider text-xs">
              No commands found
            </div>
          ) : (
            Object.entries(groupedCommands).map(([category, items]) => (
              <div key={category}>
                {/* Category Header */}
                <div className="px-4 py-2 bg-zinc-950 border-b border-gray-800">
                  <div className="text-xs text-gray-500 uppercase tracking-widest font-[family-name:var(--font-jetbrains)]">
                    {category}
                  </div>
                </div>

                {/* Category Items */}
                {items.map((cmd) => {
                  const currentIndex = commandIndex++;
                  const isSelected = currentIndex === selectedIndex;

                  return (
                    <div
                      key={cmd.id}
                      onClick={() => executeCommand(cmd)}
                      className={`
                        flex items-center gap-4 px-4 py-3 cursor-pointer
                        border-b border-gray-900 transition-colors
                        ${isSelected ? "bg-cyan-950/20 border-l-4 border-cyan-400" : "hover:bg-zinc-950"}
                      `}
                    >
                      {/* Icon */}
                      {cmd.icon && (
                        <span className={`text-lg w-6 text-center ${isSelected ? "text-cyan-400" : "text-gray-500"}`}>
                          {cmd.icon}
                        </span>
                      )}

                      {/* Title & Subtitle */}
                      <div className="flex-1">
                        <div className={`text-sm uppercase tracking-wide font-[family-name:var(--font-jetbrains)] ${isSelected ? "text-cyan-400" : "text-white"}`}>
                          {cmd.title}
                        </div>
                        {cmd.subtitle && (
                          <div className="text-xs text-gray-500 mt-0.5">
                            {cmd.subtitle}
                          </div>
                        )}
                      </div>

                      {/* Selection indicator */}
                      {isSelected && (
                        <div className="text-cyan-400 text-xs font-mono">
                          ↵ ENTER
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t-2 border-gray-800 bg-zinc-950 px-4 py-3">
          <div className="flex items-center gap-4 text-xs text-gray-500 font-mono">
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-black border border-gray-700 text-cyan-400">↑↓</kbd>
              <span>Navigate</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-black border border-gray-700 text-cyan-400">↵</kbd>
              <span>Select</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-black border border-gray-700 text-cyan-400">ESC</kbd>
              <span>Close</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
