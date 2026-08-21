import { AppLayout } from "@/components/layout";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Briefcase, Zap, ShieldCheck } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="w-full border-b bg-card/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2 font-bold text-xl text-primary">
            <Briefcase className="h-6 w-6" />
            <span>AI JobMatch</span>
          </div>
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
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center">
        <section className="w-full py-20 md:py-32 flex flex-col items-center justify-center text-center px-4 bg-gradient-to-b from-accent/30 to-background">
          <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm text-primary mb-6 animate-in fade-in slide-in-from-bottom-2">
            <span className="flex h-2 w-2 rounded-full bg-primary mr-2"></span>
            Pakistan's First AI Career Companion
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight max-w-4xl text-foreground animate-in fade-in slide-in-from-bottom-3 duration-500 delay-100">
            Find the right job, <br className="hidden md:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">with high precision.</span>
          </h1>
          
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
            We analyze your resume against live opportunities in Pakistan to give you a focused, confident path to relevant work. No more endless scrolling.
          </p>
          
          <div className="mt-10 flex flex-col sm:flex-row gap-4 animate-in fade-in slide-in-from-bottom-5 duration-500 delay-300">
            <Button asChild size="lg" className="text-base h-12 px-8 shadow-md">
              <Link href="/sign-up">
                Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-base h-12 px-8">
              <Link href="/about">How it works</Link>
            </Button>
          </div>
        </section>

        <section className="w-full py-20 bg-card border-y">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                  <Zap className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold">AI-Powered Matching</h3>
                <p className="text-muted-foreground">Upload your resume and let our engine find roles where your skills actually matter.</p>
              </div>
              
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="h-16 w-16 bg-secondary/10 rounded-2xl flex items-center justify-center text-secondary">
                  <Briefcase className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold">Curated Local Jobs</h3>
                <p className="text-muted-foreground">Focused on opportunities in Lahore, Karachi, Islamabad, and remote roles available in PK.</p>
              </div>
              
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="h-16 w-16 bg-accent rounded-2xl flex items-center justify-center text-primary">
                  <ShieldCheck className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold">Secure & Private</h3>
                <p className="text-muted-foreground">Your resume data is processed securely and never shared with third parties without intent.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="w-full py-8 border-t bg-background text-center">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} AI JobMatch. Built for professionals in Pakistan.
        </p>
      </footer>
    </div>
  );
}
