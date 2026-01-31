import Link from "next/link";

const navItems = [
  { href: "/", label: "Resumen", icon: "~" },
  { href: "/projects", label: "Proyectos", icon: "#" },
  { href: "/tokens", label: "Tokens", icon: "$" },
  { href: "/analytics", label: "Analytics", icon: "^" },
  { href: "/quality", label: "Calidad", icon: "%" },
  { href: "/kanban", label: "Kanban", icon: "=" },
];

const bottomNavItems = [
  { href: "/settings", label: "Settings", icon: "*" },
];

export function Sidebar() {
  return (
    <aside className="w-56 shrink-0 border-r bg-sidebar text-sidebar-foreground p-4 flex flex-col gap-1">
      <div className="font-bold text-lg mb-6 px-3">AIAIAI</div>
      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
          >
            <span className="font-mono text-muted-foreground w-4 text-center">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="border-t pt-2">
        {bottomNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
          >
            <span className="font-mono text-muted-foreground w-4 text-center">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </div>
    </aside>
  );
}
