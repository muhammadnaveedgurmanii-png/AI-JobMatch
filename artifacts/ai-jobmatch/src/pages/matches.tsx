import { AppLayout } from "@/components/layout";
import { useListMatches, type JobMatch } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Building, MapPin, Briefcase, ExternalLink, Target, CheckCircle2, AlertCircle } from "lucide-react";
import { Link } from "wouter";

export default function MatchesPage() {
  const { data: matches, isLoading, isError } = useListMatches();

  return (
    <AppLayout>
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Your Matches</h1>
            <p className="text-muted-foreground mt-1">Jobs ranked by compatibility with your resume.</p>
          </div>
          <Button asChild variant="outline">
            <Link href="/profile">Update Profile & Resume</Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : isError ? (
          <div className="text-center py-20 bg-card rounded-xl border">
            <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4 opacity-50" />
            <h3 className="text-lg font-medium">Unable to load matches</h3>
            <p className="text-muted-foreground mt-1">Ensure your resume is uploaded in your profile.</p>
            <Button asChild className="mt-4">
              <Link href="/profile">Go to Profile</Link>
            </Button>
          </div>
        ) : matches && matches.length > 0 ? (
          <div className="space-y-6">
            {matches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-card rounded-xl border border-dashed">
            <Target className="mx-auto h-12 w-12 text-muted-foreground mb-4 opacity-20" />
            <h3 className="text-lg font-medium">No strong matches yet</h3>
            <p className="text-muted-foreground mt-1 max-w-md mx-auto">
              We couldn't find high-confidence matches for your current resume profile. Try updating your skills or experience.
            </p>
            <Button asChild className="mt-6">
              <Link href="/profile">Improve Profile</Link>
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function MatchCard({ match }: { match: JobMatch }) {
  // Determine color based on match percentage
  const matchColorClass = 
    match.matchPercentage >= 80 ? "text-green-600 dark:text-green-400" :
    match.matchPercentage >= 60 ? "text-amber-600 dark:text-amber-400" :
    "text-muted-foreground";
    
  const matchBgClass = 
    match.matchPercentage >= 80 ? "bg-green-100 dark:bg-green-900/30" :
    match.matchPercentage >= 60 ? "bg-amber-100 dark:bg-amber-900/30" :
    "bg-muted";

  return (
    <Card className="overflow-hidden border-t-4 hover-elevate transition-all" style={{ borderTopColor: `hsl(var(--${match.matchPercentage >= 80 ? 'primary' : 'muted'}))` }}>
      <div className="md:flex">
        {/* Score side panel */}
        <div className={`p-6 flex flex-col items-center justify-center shrink-0 border-b md:border-b-0 md:border-r w-full md:w-48 ${matchBgClass}`}>
          <div className="relative flex items-center justify-center">
            <svg className="w-24 h-24 transform -rotate-90">
              <circle cx="48" cy="48" r="44" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-background/50" />
              <circle 
                cx="48" cy="48" r="44" 
                stroke="currentColor" 
                strokeWidth="6" 
                fill="transparent" 
                strokeDasharray={`${2 * Math.PI * 44}`}
                strokeDashoffset={`${2 * Math.PI * 44 * (1 - match.matchPercentage / 100)}`}
                className={matchColorClass}
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className={`text-2xl font-bold ${matchColorClass}`}>{match.matchPercentage}%</span>
            </div>
          </div>
          <span className="font-semibold text-sm mt-3 uppercase tracking-wider opacity-80">Match Score</span>
        </div>

        {/* Content */}
        <div className="flex-1 p-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="space-y-3 flex-1">
              <div>
                <h3 className="text-xl font-bold leading-tight">{match.title}</h3>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center font-medium text-foreground">
                    <Building className="mr-1 h-4 w-4" /> {match.company}
                  </span>
                  <span className="flex items-center">
                    <MapPin className="mr-1 h-4 w-4" /> {match.location} {match.country ? `, ${match.country}` : ''}
                  </span>
                  <span className="flex items-center">
                    <Briefcase className="mr-1 h-4 w-4" /> {match.jobType}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center">
                    <CheckCircle2 className="mr-1 h-3 w-3 text-green-500" /> Matched Skills
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {match.matchedSkills.length > 0 ? (
                      match.matchedSkills.map(skill => (
                        <Badge key={skill} variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900/50">
                          {skill}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">None identified</span>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center">
                    <AlertCircle className="mr-1 h-3 w-3 text-amber-500" /> Missing Skills
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {match.missingSkills.length > 0 ? (
                      match.missingSkills.map(skill => (
                        <Badge key={skill} variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50">
                          {skill}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">None identified</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="shrink-0 flex items-center">
              <Button asChild size="lg" className="w-full md:w-auto">
                <a href={match.applyUrl} target="_blank" rel="noopener noreferrer">
                  Apply Now <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
