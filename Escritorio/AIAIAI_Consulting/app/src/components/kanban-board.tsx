"use client";

import { useState } from "react";
import { KanbanCard } from "@/components/kanban-card";
import type { Project } from "@/lib/data";

type Status = "active" | "paused" | "completed";

const columns: { id: Status; label: string; color: string }[] = [
  { id: "active", label: "Activo", color: "bg-green-500" },
  { id: "paused", label: "Pausado", color: "bg-yellow-500" },
  { id: "completed", label: "Completado", color: "bg-blue-500" },
];

export function KanbanBoard({ projects }: { projects: Project[] }) {
  const [items, setItems] = useState(projects);
  const [dragOverCol, setDragOverCol] = useState<Status | null>(null);

  function handleDragStart(e: React.DragEvent, projectId: string) {
    e.dataTransfer.setData("text/plain", projectId);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(e: React.DragEvent, colId: Status) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverCol(colId);
  }

  function handleDragLeave() {
    setDragOverCol(null);
  }

  async function handleDrop(e: React.DragEvent, targetStatus: Status) {
    e.preventDefault();
    setDragOverCol(null);
    const projectId = e.dataTransfer.getData("text/plain");

    // Capture original status for revert
    const originalItems = items;

    // Optimistic update
    setItems((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, status: targetStatus } : p))
    );

    try {
      const res = await fetch("/api/projects/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: projectId, status: targetStatus }),
      });

      if (!res.ok) {
        // Revert on server error
        setItems(originalItems);
      }
    } catch {
      // Revert on network error
      setItems(originalItems);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      {columns.map((col) => {
        const colItems = items.filter((p) => p.status === col.id);
        const isOver = dragOverCol === col.id;
        return (
          <div
            key={col.id}
            onDragOver={(e) => handleDragOver(e, col.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, col.id)}
            className={`flex flex-col rounded-xl border p-4 transition-colors ${
              isOver ? "border-primary bg-accent/50" : "bg-muted/30"
            }`}
          >
            <div className="flex items-center gap-2 mb-4">
              <div className={`w-3 h-3 rounded-full ${col.color}`} />
              <h2 className="font-semibold text-sm">{col.label}</h2>
              <span className="text-xs text-muted-foreground ml-auto">
                {colItems.length}
              </span>
            </div>
            <div className="flex flex-col gap-3 flex-1 min-h-[200px]">
              {colItems.map((project) => (
                <KanbanCard
                  key={project.id}
                  project={project}
                  onDragStart={handleDragStart}
                />
              ))}
              {colItems.length === 0 && (
                <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground border border-dashed rounded-lg">
                  Arrastra proyectos aqui
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
