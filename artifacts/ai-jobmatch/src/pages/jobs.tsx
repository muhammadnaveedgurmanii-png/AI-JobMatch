import { AppLayout } from "@/components/layout";
import {
  getListJobsQueryKey,
  getSearchLiveJobsQueryKey,
  useListJobs,
  useSearchLiveJobs,
  type Job,
  type JobTypeParameter,
  type WorkModeParameter,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, Briefcase, Clock, Building, Globe, ExternalLink, Search } from "lucide-react";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select } from "@/components/ui/select";

export default function JobsPage() {
  const [activeTab, setActiveTab] = useState("local");
  
  // Local Jobs state
  const [localLocation, setLocalLocation] = useState("Lahore");
  const [localJobType, setLocalJobType] = useState<JobTypeParameter | undefined>(undefined);
  const [localWorkMode, setLocalWorkMode] = useState<WorkModeParameter | undefined>(undefined);
  
  const localParams = {
    location: localLocation || undefined,
    jobType: localJobType,
    workMode: localWorkMode,
  };
  const { data: localJobs, isLoading: isLoadingLocal } = useListJobs(
    localParams,
    { query: { queryKey: getListJobsQueryKey(localParams) } },
  );

  // Live Jobs state
  const [liveQuery, setLiveQuery] = useState("");
  const [liveLocation, setLiveLocation] = useState("Lahore");
  const [liveCountry, setLiveCountry] = useState("PK");
  const [liveJobType, setLiveJobType] = useState<JobTypeParameter | undefined>(undefined);
  const [liveWorkMode, setLiveWorkMode] = useState<WorkModeParameter | undefined>(undefined);
  const [livePage, setLivePage] = useState(1);
  const [liveSearchTrigger, setLiveSearchTrigger] = useState(0);

  const liveParams = {
    query: liveQuery || undefined,
    location: liveLocation || undefined,
    country: liveCountry || undefined,
    jobType: liveJobType,
    workMode: liveWorkMode,
    page: livePage,
  };
  const { data: liveJobsData, isLoading: isLoadingLive, isError: isLiveError, error: liveError } = useSearchLiveJobs(liveParams, { 
    query: { 
      queryKey: [...getSearchLiveJobsQueryKey(liveParams), liveSearchTrigger],
      enabled: liveSearchTrigger > 0
    } 
  });

  const handleSearchLive = () => {
    setLivePage(1);
    setLiveSearchTrigger(t => t + 1);
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-in fade-in duration-500">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Job Discovery</h1>
          <p className="text-muted-foreground mt-1">Browse curated local jobs or search the live global market.</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-[400px] grid-cols-2">
            <TabsTrigger value="local">Curated Local</TabsTrigger>
            <TabsTrigger value="live">Live Search</TabsTrigger>
          </TabsList>
          
          <TabsContent value="local" className="space-y-6 mt-6">
            <Card className="bg-muted/30 border-muted">
              <CardContent className="p-4 grid gap-4 grid-cols-1 md:grid-cols-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Location</label>
                  <Select value={localLocation} onChange={(e) => setLocalLocation(e.target.value)}>
                    <option value="">All Locations</option>
                    <option value="Lahore">Lahore</option>
                    <option value="Karachi">Karachi</option>
                    <option value="Islamabad">Islamabad</option>
                    <option value="Remote">Remote</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Job Type</label>
                  <Select value={localJobType || ""} onChange={(e) => setLocalJobType((e.target.value as JobTypeParameter) || undefined)}>
                    <option value="">All Types</option>
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Internship">Internship</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Work Mode</label>
                  <Select value={localWorkMode || ""} onChange={(e) => setLocalWorkMode((e.target.value as WorkModeParameter) || undefined)}>
                    <option value="">All Modes</option>
                    <option value="On-site">On-site</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="Remote">Remote</option>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button variant="outline" className="w-full" onClick={() => { setLocalLocation("Lahore"); setLocalJobType(undefined); setLocalWorkMode(undefined); }}>
                    Reset Filters
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {isLoadingLocal ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-20 w-full" />
                    </CardContent>
                  </Card>
                ))
              ) : localJobs?.length ? (
                <div className="grid gap-4">
                  {localJobs.map(job => (
                    <JobCard key={job.id} job={job} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 border rounded-xl bg-card border-dashed">
                  <Briefcase className="mx-auto h-12 w-12 text-muted-foreground mb-4 opacity-20" />
                  <h3 className="text-lg font-medium">No jobs found</h3>
                  <p className="text-muted-foreground mt-1">Try adjusting your filters to see more results.</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="live" className="space-y-6 mt-6">
            <Card className="bg-muted/30 border-muted">
              <CardContent className="p-4 grid gap-4 grid-cols-1 md:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Search Query</label>
                  <Input 
                    placeholder="e.g. Frontend Developer" 
                    value={liveQuery}
                    onChange={(e) => setLiveQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchLive()}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Location</label>
                  <Input 
                    placeholder="e.g. Lahore" 
                    value={liveLocation}
                    onChange={(e) => setLiveLocation(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchLive()}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Country</label>
                  <Select value={liveCountry} onChange={(e) => setLiveCountry(e.target.value)}>
                    <option value="PK">Pakistan</option>
                    <option value="AE">United Arab Emirates</option>
                    <option value="SA">Saudi Arabia</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Job Type</label>
                  <Select value={liveJobType || ""} onChange={(e) => setLiveJobType((e.target.value as JobTypeParameter) || undefined)}>
                    <option value="">All Types</option>
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Internship">Internship</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Work Mode</label>
                  <Select value={liveWorkMode || ""} onChange={(e) => setLiveWorkMode((e.target.value as WorkModeParameter) || undefined)}>
                    <option value="">All Modes</option>
                    <option value="On-site">On-site</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="Remote">Remote</option>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button className="w-full" onClick={handleSearchLive}>
                    <Search className="mr-2 h-4 w-4" /> Search
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {liveSearchTrigger === 0 ? (
                <div className="text-center py-12 border rounded-xl bg-card border-dashed">
                  <Globe className="mx-auto h-12 w-12 text-muted-foreground mb-4 opacity-20" />
                  <h3 className="text-lg font-medium">Search the live job market</h3>
                  <p className="text-muted-foreground mt-1">Enter a query to find roles beyond our curated list.</p>
                </div>
              ) : isLoadingLive ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-20 w-full" />
                    </CardContent>
                  </Card>
                ))
              ) : isLiveError ? (
                <div className="text-center py-12 border rounded-xl bg-card border-destructive/30">
                  <Briefcase className="mx-auto h-12 w-12 text-destructive mb-4 opacity-50" />
                  <h3 className="text-lg font-medium">Live search is unavailable</h3>
                  <p className="text-muted-foreground mt-1">
                    {liveError instanceof Error ? liveError.message : "Please try again shortly."}
                  </p>
                </div>
              ) : liveJobsData?.jobs?.length ? (
                <>
                  <div className="grid gap-4">
                    {liveJobsData.jobs.map((job) => (
                      <JobCard key={job.id} job={job} />
                    ))}
                  </div>
                  <div className="flex justify-between items-center py-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setLivePage(p => Math.max(1, p - 1))}
                      disabled={livePage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm font-medium">Page {liveJobsData.page}</span>
                    <Button 
                      variant="outline" 
                      onClick={() => setLivePage(p => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 border rounded-xl bg-card border-dashed">
                  <Briefcase className="mx-auto h-12 w-12 text-muted-foreground mb-4 opacity-20" />
                  <h3 className="text-lg font-medium">No live jobs found</h3>
                  <p className="text-muted-foreground mt-1">Try a different search query or location.</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

function JobCard({ job }: { job: Job }) {
  return (
    <Card className="hover-elevate transition-all overflow-hidden">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-3 flex-1">
            <div>
              <h3 className="text-xl font-semibold leading-tight">{job.title}</h3>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center font-medium text-foreground">
                  <Building className="mr-1 h-4 w-4" /> {job.company}
                </span>
                <span className="flex items-center">
                  <MapPin className="mr-1 h-4 w-4" /> {job.location} {job.country ? `, ${job.country}` : ''}
                </span>
                <span className="flex items-center">
                  <Briefcase className="mr-1 h-4 w-4" /> {job.jobType}
                </span>
                <span className="flex items-center">
                  <Clock className="mr-1 h-4 w-4" /> {job.workMode}
                </span>
              </div>
            </div>
            
            <p className="text-sm line-clamp-2 text-muted-foreground">{job.description}</p>
            
            {job.requiredSkills && job.requiredSkills.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {job.requiredSkills.slice(0, 5).map((skill: string, i: number) => (
                  <Badge key={i} variant="secondary" className="bg-secondary/10 text-secondary-foreground font-normal hover:bg-secondary/20 border-transparent">
                    {skill}
                  </Badge>
                ))}
                {job.requiredSkills.length > 5 && (
                  <Badge variant="outline" className="text-muted-foreground">+{job.requiredSkills.length - 5} more</Badge>
                )}
              </div>
            )}
          </div>
          
          <div className="flex md:flex-col items-center gap-3 shrink-0 pt-1">
            <Button asChild className="w-full md:w-auto">
              <a href={job.applyUrl} target="_blank" rel="noopener noreferrer">
                Apply Now <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
            <span className="text-xs text-muted-foreground hidden md:block">Via {job.source}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
