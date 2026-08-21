import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { Show, useClerk, useUser } from "@clerk/react";
import { Briefcase, LayoutDashboard, LogOut, Search, Target, UserCircle, Menu, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { signOut } = useClerk();
  const { user } = useUser();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/jobs", label: "Discovery", icon: Search },
    { href: "/matches", label: "Matches", icon: Target },
    { href: "/profile", label: "Profile", icon: UserCircle },
  ];

  const closeMobile = () => setIsMobileOpen(false);

  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row bg-background font-sans selection:bg-primary/20 selection:text-primary">
      {/* Mobile Header */}
      <header className="md:hidden sticky top-0 z-40 flex items-center justify-between h-16 px-4 border-b bg-background/80 backdrop-blur-md">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg text-primary">
          <Sparkles className="h-5 w-5" />
          <span>AI JobMatch</span>
        </Link>
        <Button variant="ghost" size="icon" onClick={() => setIsMobileOpen(true)} className="md:hidden text-foreground">
          <Menu className="h-5 w-5" />
        </Button>
      </header>

      {/* Sidebar Overlay (Mobile) */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 md:hidden animate-in fade-in"
          onClick={closeMobile}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:sticky top-0 left-0 z-50 h-[100dvh] w-64 border-r bg-card shadow-sm transition-transform duration-300
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        flex flex-col
      `}>
        <div className="h-16 flex items-center px-6 border-b">
          <Link href="/" onClick={closeMobile} className="flex items-center gap-2.5 font-bold text-xl text-foreground hover:text-primary transition-colors">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="tracking-tight">AI JobMatch</span>
          </Link>
          <Button variant="ghost" size="icon" onClick={closeMobile} className="md:hidden ml-auto -mr-2">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <Show when="signed-in">
          <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
            <div className="px-2 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Workspace
            </div>
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={closeMobile}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive 
                      ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20" 
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? "text-primary-foreground/90" : "text-muted-foreground"}`} />
                  {link.label}
                </Link>
              );
            })}
          </nav>
          
          <div className="p-4 border-t bg-card/50">
            <div className="flex items-center gap-3 px-2 py-2 mb-3">
              <div className="w-9 h-9 rounded-full bg-accent text-primary flex items-center justify-center font-bold text-sm">
                {user?.firstName?.charAt(0) || user?.primaryEmailAddress?.emailAddress?.charAt(0)?.toUpperCase() || "C"}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold truncate text-foreground">
                  {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : "Candidate"}
                </span>
                <span className="text-xs text-muted-foreground truncate">
                  {user?.primaryEmailAddress?.emailAddress}
                </span>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start text-muted-foreground hover:text-foreground"
              onClick={() => signOut({ redirectUrl: basePath || "/" })}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </div>
        </Show>

        <Show when="signed-out">
          <div className="flex-1 p-6 flex flex-col justify-center">
            <div className="space-y-4">
              <Button asChild variant="outline" className="w-full">
                <Link href="/about" onClick={closeMobile}>About</Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/sign-in" onClick={closeMobile}>Sign In</Link>
              </Button>
              <Button asChild className="w-full">
                <Link href="/sign-up" onClick={closeMobile}>Sign Up</Link>
              </Button>
            </div>
          </div>
        </Show>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 flex flex-col">
        <div className="flex-1 p-4 md:p-8 max-w-[1200px] w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
