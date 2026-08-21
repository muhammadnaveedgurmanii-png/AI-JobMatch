import { AppLayout } from "@/components/layout";
import { useGetDashboardSummary } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Briefcase, Target, MapPin, Award } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const { data: summary, isLoading, isError } = useGetDashboardSummary();

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-[200px]" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-[140px] rounded-xl" />
            <Skeleton className="h-[140px] rounded-xl" />
            <Skeleton className="h-[140px] rounded-xl" />
          </div>
        </div>
      </AppLayout>
    );
  }

  if (isError || !summary) {
    return (
      <AppLayout>
        <div className="text-center py-20">
          <h2 className="text-2xl font-semibold text-destructive">Failed to load dashboard</h2>
          <p className="text-muted-foreground mt-2">Please try again later.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Your AI-powered career readiness overview.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover-elevate transition-all">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Profile Completeness
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{summary.profileCompleteness}%</div>
              <Progress value={summary.profileCompleteness} className="mt-4 h-2" />
              <p className="text-xs text-muted-foreground mt-3">
                {summary.profileCompleteness < 100 
                  ? "Update your profile and upload your resume to improve matches."
                  : "Your profile is fully optimized for matching."}
              </p>
            </CardContent>
          </Card>

          <Card className="hover-elevate transition-all">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                Local Jobs Available
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{summary.localJobs}</div>
              <p className="text-xs text-muted-foreground mt-3 pt-3 border-t">
                Active opportunities in your area.
              </p>
              <Button asChild variant="link" className="px-0 mt-1 h-auto text-primary">
                <Link href="/jobs">Browse all jobs &rarr;</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover-elevate transition-all">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-primary" />
                Matched Jobs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-secondary">{summary.matchedJobs}</div>
              <p className="text-xs text-muted-foreground mt-3 pt-3 border-t">
                High-confidence matches based on your resume.
              </p>
              <Button asChild variant="link" className="px-0 mt-1 h-auto text-primary">
                <Link href="/matches">View your matches &rarr;</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Top Demanded Skills in Your Area
          </h2>
          <Card>
            <CardContent className="p-0">
              <div className="divide-y border-t-0 border-b-0 border-x-0">
                {summary.topSkills.length > 0 ? summary.topSkills.map((skillItem, i) => (
                  <div key={i} className="flex justify-between items-center p-4 hover:bg-muted/50 transition-colors">
                    <span className="font-medium">{skillItem.skill}</span>
                    <span className="text-sm bg-accent text-accent-foreground px-3 py-1 rounded-full font-semibold">
                      {skillItem.jobs} jobs
                    </span>
                  </div>
                )) : (
                  <div className="p-8 text-center text-muted-foreground">
                    No skill insights available yet.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
