import { AppLayout } from "@/components/layout";
import { useGetProfile, useUpdateProfile, useGetResume, useUpdateResume, useRequestResumeUploadUrl, useCompleteResumeUpload, getGetProfileQueryKey, getGetResumeQueryKey, getGetDashboardSummaryQueryKey, getListMatchesQueryKey, type CandidateProfileInput, type ResumeProfileInput } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Select } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useState, useRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Upload, FileText, CheckCircle2, UserCircle, FileCheck, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function ProfilePage() {
  return (
    <AppLayout>
      <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Your Profile</h1>
          <p className="text-muted-foreground mt-1">Manage your professional identity and resume for better matching.</p>
        </div>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="resume">Resume & Skills</TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic" className="mt-6">
            <BasicInfoForm />
          </TabsContent>
          
          <TabsContent value="resume" className="mt-6">
            <ResumeForm />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

function BasicInfoForm() {
  const { data: profile, isLoading } = useGetProfile();
  const updateProfile = useUpdateProfile();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState<CandidateProfileInput>({
    fullName: "",
    email: "",
    preferredLocation: "Lahore",
    country: "PK"
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        fullName: profile.fullName || "",
        email: profile.email || "",
        preferredLocation: profile.preferredLocation || "Lahore",
        country: profile.country || "PK"
      });
    }
  }, [profile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate({ data: formData }, {
      onSuccess: () => {
        toast({ title: "Profile updated successfully" });
        queryClient.invalidateQueries({ queryKey: getGetProfileQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
      },
      onError: (error: any) => {
        toast({ title: "Failed to update profile", description: error.message, variant: "destructive" });
      }
    });
  };

  if (isLoading) return <ProfileSkeleton />;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><UserCircle className="h-5 w-5 text-primary" /> Personal Information</CardTitle>
        <CardDescription>Update your contact details and location preferences.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input 
                id="fullName" 
                value={formData.fullName} 
                onChange={(e) => setFormData({...formData, fullName: e.target.value})} 
                required 
                minLength={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input 
                id="email" 
                type="email" 
                value={formData.email} 
                onChange={(e) => setFormData({...formData, email: e.target.value})} 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="preferredLocation">Preferred City</Label>
              <Select 
                id="preferredLocation" 
                value={formData.preferredLocation} 
                onChange={(e) => setFormData({...formData, preferredLocation: e.target.value})}
              >
                <option value="Lahore">Lahore</option>
                <option value="Karachi">Karachi</option>
                <option value="Islamabad">Islamabad</option>
                <option value="Remote">Remote Only</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Select 
                id="country" 
                value={formData.country} 
                onChange={(e) => setFormData({...formData, country: e.target.value})}
              >
                <option value="PK">Pakistan</option>
                <option value="AE">United Arab Emirates</option>
                <option value="SA">Saudi Arabia</option>
              </Select>
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t bg-muted/20 px-6 py-4">
          <Button type="submit" disabled={updateProfile.isPending}>
            {updateProfile.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save Changes
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

function ResumeForm() {
  const { data: resume, isLoading } = useGetResume();
  const updateResume = useUpdateResume();
  const requestUrl = useRequestResumeUploadUrl();
  const completeUpload = useCompleteResumeUpload();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState<ResumeProfileInput>({
    professionalSummary: "",
    skills: [],
    education: "",
    experience: ""
  });
  
  const [skillsText, setSkillsText] = useState("");

  useEffect(() => {
    if (resume) {
      setFormData({
        professionalSummary: resume.professionalSummary || "",
        skills: resume.skills || [],
        education: resume.education || "",
        experience: resume.experience || ""
      });
      setSkillsText((resume.skills || []).join(", "));
    }
  }, [resume]);

  const handleSkillsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSkillsText(e.target.value);
    const skillsList = e.target.value.split(",").map(s => s.trim()).filter(s => s.length > 0);
    setFormData(prev => ({ ...prev, skills: skillsList }));
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateResume.mutate({ data: formData }, {
      onSuccess: () => {
        toast({ title: "Resume profile updated successfully" });
        queryClient.invalidateQueries({ queryKey: getGetResumeQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListMatchesQueryKey() });
      },
      onError: (error: any) => {
        toast({ title: "Failed to update resume profile", description: error.message, variant: "destructive" });
      }
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast({ title: "Invalid file type", description: "Only PDF files are supported.", variant: "destructive" });
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum file size is 5MB.", variant: "destructive" });
      return;
    }

    setIsUploading(true);

    try {
      // 1. Request URL
      const target = await requestUrl.mutateAsync({ 
        data: { 
          fileName: file.name, 
          contentType: "application/pdf", 
          size: file.size 
        } 
      });

      // 2. Upload directly to private object storage.
      const uploadResponse = await fetch(target.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": "application/pdf" },
        body: file
      });
      if (!uploadResponse.ok) {
        throw new Error("The resume could not be uploaded to secure storage.");
      }

      // 3. Complete and extract
      await completeUpload.mutateAsync({
        data: {
          objectPath: target.objectPath,
          fileName: file.name
        }
      });

      toast({ 
        title: "Resume uploaded successfully", 
        description: "Your text has been extracted and profile updated." 
      });
      
      // Invalidate everything to refresh extraction results
      queryClient.invalidateQueries({ queryKey: getGetResumeQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
      queryClient.invalidateQueries({ queryKey: getListMatchesQueryKey() });
      
    } catch (error: any) {
      toast({ 
        title: "Upload failed", 
        description: error.message || "An error occurred during upload.", 
        variant: "destructive" 
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (isLoading) return <ProfileSkeleton />;

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> Auto-Extract from PDF</CardTitle>
          <CardDescription>Upload your resume to automatically extract your skills, experience, and summary.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Button 
              type="button" 
              onClick={() => fileInputRef.current?.click()} 
              disabled={isUploading}
              className="w-full sm:w-auto"
            >
              {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              {isUploading ? "Processing..." : "Upload PDF Resume"}
            </Button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".pdf" 
              onChange={handleFileUpload} 
            />
            
            {resume?.resumeFileName && !isUploading && (
              <div className="flex items-center text-sm text-green-700 dark:text-green-400 bg-green-100/50 dark:bg-green-900/20 px-3 py-1.5 rounded-md border border-green-200 dark:border-green-800">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Current: <span className="font-medium ml-1 truncate max-w-[150px]">{resume.resumeFileName}</span>
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-3">Supports PDF up to 5MB. Uploading will overwrite manual entries below.</p>
        </CardContent>
      </Card>

      {/* Manual Entry Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileCheck className="h-5 w-5 text-secondary" /> Manual Profile Details</CardTitle>
          <CardDescription>Review and edit the details used for job matching.</CardDescription>
        </CardHeader>
        <form onSubmit={handleManualSubmit}>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="skills">Key Skills (comma separated)</Label>
              <Input 
                id="skills" 
                value={skillsText} 
                onChange={handleSkillsChange}
                placeholder="e.g. React, Node.js, Project Management"
              />
              {formData.skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {formData.skills.map((skill, i) => (
                    <Badge key={i} variant="secondary">{skill}</Badge>
                  ))}
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="summary">Professional Summary</Label>
              <Textarea 
                id="summary" 
                value={formData.professionalSummary} 
                onChange={(e) => setFormData({...formData, professionalSummary: e.target.value})}
                placeholder="A brief overview of your professional background and goals."
                className="min-h-[100px]"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="experience">Experience</Label>
              <Textarea 
                id="experience" 
                value={formData.experience} 
                onChange={(e) => setFormData({...formData, experience: e.target.value})}
                placeholder="List your previous roles and responsibilities."
                className="min-h-[150px]"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="education">Education</Label>
              <Textarea 
                id="education" 
                value={formData.education} 
                onChange={(e) => setFormData({...formData, education: e.target.value})}
                placeholder="List your degrees and institutions."
                className="min-h-[100px]"
              />
            </div>
          </CardContent>
          <CardFooter className="border-t bg-muted/20 px-6 py-4">
            <Button type="submit" disabled={updateResume.isPending}>
              {updateResume.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save Resume Profile
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-1/3 mb-2" />
        <Skeleton className="h-4 w-1/2" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
