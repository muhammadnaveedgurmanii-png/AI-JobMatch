import { Link, useLocation } from "wouter";
import { Show, useClerk, useUser } from "@clerk/react";
import { Briefcase, LayoutDashboard, LogOut, Search, Target, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const [location] = useLocation();
  const { signOut } = useClerk();
  const { user } = useUser();

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/jobs", label: "Jobs", icon: Search },
    { href: "/matches", label: "Matches", icon: Target },
    { href: "/profile", label: "Profile", icon: UserCircle },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-card/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary transition-opacity hover:opacity-80">
          <Briefcase className="h-6 w-6" />
          <span>AI JobMatch</span>
        </Link>
        
        <Show when="signed-in">
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                    isActive ? "text-primary" : "text-muted-foreground hover:text-primary"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-muted-foreground lg:inline">
              {user?.firstName ?? user?.primaryEmailAddress?.emailAddress ?? "Candidate"}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => signOut({ redirectUrl: basePath || "/" })}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </div>
        </Show>

        <Show when="signed-out">
          <nav className="flex items-center gap-4">
            <Link href="/about" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              About
            </Link>
            <Link href="/sign-in" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring h-10 px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground">
              Sign In
            </Link>
            <Link href="/sign-up" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring h-10 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90">
              Sign Up
            </Link>
          </nav>
        </Show>
      </div>
    </header>
  );
}

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        {children}
      </main>
    </div>
  );
}
