import { AppLayout } from "@/components/layout";
import { Shield, Target, Users } from "lucide-react";

export default function AboutPage() {
  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 py-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">Our Purpose</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Bridging the gap between talented professionals and meaningful work in Pakistan.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 mt-12 items-center">
          <div className="space-y-6 text-lg leading-relaxed text-muted-foreground">
            <p>
              The job market in Pakistan is evolving rapidly, but the process of finding the right role remains incredibly inefficient. Brilliant graduates and experienced professionals often spend hours sifting through irrelevant postings, while companies struggle to find candidates with the exact skills they need.
            </p>
            <p>
              <strong className="text-foreground">AI JobMatch</strong> was built to solve this exact problem. By leveraging advanced text extraction and matching algorithms, we turn the traditional job hunt upside down. Instead of you searching for jobs, we bring the right jobs to your resume.
            </p>
          </div>
          <div className="bg-card border rounded-2xl p-8 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -mr-10 -mt-10"></div>
            <ul className="space-y-6 relative z-10">
              <li className="flex gap-4">
                <div className="bg-primary/10 p-2 rounded-lg h-fit">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">Precision Over Volume</h3>
                  <p className="text-sm text-muted-foreground mt-1">We value quality matches over throwing thousands of generic listings at you.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="bg-secondary/10 p-2 rounded-lg h-fit">
                  <Users className="h-6 w-6 text-secondary" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">Pakistan First</h3>
                  <p className="text-sm text-muted-foreground mt-1">Optimized for local job markets, work modes, and standard industry practices here.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-lg h-fit">
                  <Shield className="h-6 w-6 text-green-700 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">Security Commitments</h3>
                  <p className="text-sm text-muted-foreground mt-1">Your data is yours. We use secure short-lived URLs for document handling and do not sell your personal info.</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
