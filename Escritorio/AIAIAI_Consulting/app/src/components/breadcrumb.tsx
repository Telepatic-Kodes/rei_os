"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { generateBreadcrumbs } from "@/lib/breadcrumbs";

interface BreadcrumbProps {
  projectName?: string;
}

export function Breadcrumb({ projectName }: BreadcrumbProps) {
  const pathname = usePathname();
  const breadcrumbs = generateBreadcrumbs(pathname, projectName);

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-2 text-sm uppercase tracking-widest font-[family-name:var(--font-jetbrains)]"
    >
      <span className="text-cyan-400">▐</span>
      {breadcrumbs.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          {item.href ? (
            <Link
              href={item.href}
              className="text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-green-400 font-bold" aria-current="page">
              {item.label}
            </span>
          )}
          {index < breadcrumbs.length - 1 && (
            <span className="text-gray-400">→</span>
          )}
        </div>
      ))}
      <span className="text-cyan-400">▌</span>
    </nav>
  );
}
