import { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from 'wouter';
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';

import HomePage from '@/pages/home';
import DashboardPage from '@/pages/dashboard';
import ProfilePage from '@/pages/profile';
import JobsPage from '@/pages/jobs';
import MatchesPage from '@/pages/matches';
import AboutPage from '@/pages/about';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();

// REQUIRED — copy verbatim. Resolves the key from window.location.hostname
const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

// REQUIRED — copy verbatim. Empty in dev, auto-set in prod.
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

// Strip base for wouter navigation
function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env file');
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "hsl(226, 65%, 35%)", // Primary sapphire blue
    colorForeground: "hsl(220, 20%, 10%)",
    colorMutedForeground: "hsl(220, 10%, 40%)",
    colorDanger: "hsl(0, 84%, 60%)",
    colorBackground: "hsl(0, 0%, 100%)",
    colorInput: "hsl(220, 13%, 91%)",
    colorInputForeground: "hsl(220, 20%, 10%)",
    colorNeutral: "hsl(220, 13%, 85%)",
    fontFamily: "'Inter', sans-serif",
    borderRadius: "0.75rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-white rounded-2xl w-[440px] max-w-full overflow-hidden shadow-md border border-slate-200",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-2xl font-bold text-slate-900",
    headerSubtitle: "text-slate-500",
    socialButtonsBlockButtonText: "font-medium",
    formFieldLabel: "font-medium text-slate-700",
    footerActionLink: "text-primary hover:text-primary/90 font-medium",
    footerActionText: "text-slate-500",
    dividerText: "text-slate-400",
    identityPreviewEditButton: "text-primary hover:text-primary/90",
    formFieldSuccessText: "text-green-600",
    alertText: "text-red-600 font-medium",
    logoBox: "h-12 flex justify-center mb-4",
    logoImage: "h-10",
    socialButtonsBlockButton: "border-slate-200 hover:bg-slate-50",
    formButtonPrimary: "bg-primary hover:bg-primary/90 text-white shadow-sm transition-all",
    formFieldInput: "border-slate-200 bg-transparent focus:ring-2 focus:ring-primary shadow-sm",
    footerAction: "mt-6",
    dividerLine: "bg-slate-200",
    alert: "bg-red-50 border border-red-200 rounded-md p-3",
    otpCodeFieldInput: "border-slate-200 bg-transparent focus:ring-2 focus:ring-primary",
    formFieldRow: "mb-4",
    main: "w-full",
  },
};

// Route Gates
function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/dashboard" />
      </Show>
      <Show when="signed-out">
        <HomePage />
      </Show>
    </>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Show when="signed-in">
        {children}
      </Show>
      <Show when="signed-out">
        <Redirect to="/sign-in" />
      </Show>
    </>
  );
}

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 bg-gradient-to-b from-accent/30 to-background">
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} fallbackRedirectUrl="/dashboard" />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 bg-gradient-to-b from-accent/30 to-background">
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} fallbackRedirectUrl="/dashboard" />
    </div>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        queryClient.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClient]);

  return null;
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: "Welcome back",
            subtitle: "Sign in to access AI JobMatch",
          },
        },
        signUp: {
          start: {
            title: "Create your account",
            subtitle: "Find your path to relevant work",
          },
        },
      }}
      routerPush={(to: string) => setLocation(stripBase(to))}
      routerReplace={(to: string) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ClerkQueryClientCacheInvalidator />
          <ErrorBoundary resetKey={window.location.pathname}>
            <Switch>
              <Route path="/" component={HomeRedirect} />
              
              <Route path="/sign-in/*?" component={SignInPage} />
              <Route path="/sign-up/*?" component={SignUpPage} />
              
              <Route path="/about" component={AboutPage} />
              
              {/* Protected Routes */}
              <Route path="/dashboard">
                <ProtectedRoute><DashboardPage /></ProtectedRoute>
              </Route>
              <Route path="/profile">
                <ProtectedRoute><ProfilePage /></ProtectedRoute>
              </Route>
              <Route path="/jobs">
                <ProtectedRoute><JobsPage /></ProtectedRoute>
              </Route>
              <Route path="/matches">
                <ProtectedRoute><MatchesPage /></ProtectedRoute>
              </Route>
              
              <Route component={NotFound} />
            </Switch>
          </ErrorBoundary>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
