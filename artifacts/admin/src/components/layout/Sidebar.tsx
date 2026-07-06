import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, Film, Settings, LayoutList } from "lucide-react";

export function Sidebar() {
  const [location] = useLocation();

  const links = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dramas", label: "Dramas", icon: Film },
    { href: "/home-sections", label: "Home Sections", icon: LayoutList },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <aside className="w-64 bg-card border-r border-border h-full flex-col hidden md:flex">
      <div className="h-16 flex items-center px-6 border-b border-border">
        <img src={`${import.meta.env.BASE_URL}logo-wordmark.png`} alt="Nebula TV" className="h-8 w-auto" />
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {links.map((link) => {
          const isActive = link.href === "/" ? location === "/" : location.startsWith(link.href);
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive 
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon size={18} />
              {link.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
            OP
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium">Ops Team</span>
            <span className="text-xs text-muted-foreground">Admin</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
