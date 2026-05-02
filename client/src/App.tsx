import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme";
import { LanguageProvider } from "@/lib/languageContext";
import { AuthProvider, useAuth } from "@/lib/auth";
import AppLayout from "@/components/app-layout";
import LandingPage from "@/pages/landing";
import { LoginPage, RegisterPage, ForgotPasswordPage } from "@/pages/auth";
import { Loader2 } from "lucide-react";
import { lazy, Suspense, useEffect } from "react";
import { useLocation } from "wouter";

const OnboardingPage = lazy(() => import("@/pages/onboarding"));
const DashboardPage = lazy(() => import("@/pages/dashboard"));
const SubjectsPage = lazy(() => import("@/pages/subjects"));
const SubjectDetailPage = lazy(() => import("@/pages/subject-detail"));
const PlannerPage = lazy(() => import("@/pages/planner"));
const FocusPage = lazy(() => import("@/pages/focus"));
const AIAssistantPage = lazy(() => import("@/pages/ai-assistant"));
const ProgressPage = lazy(() => import("@/pages/progress"));
const ProfilePage = lazy(() => import("@/pages/profile"));
const SettingsPage = lazy(() => import("@/pages/settings"));
const FriendsPage = lazy(() => import("@/pages/friends"));
const ChatPage = lazy(() => import("@/pages/chat"));
const NotFound = lazy(() => import("@/pages/not-found"));

function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

function isKnownProtectedPath(path: string): boolean {
  return (
    path === "/onboarding" ||
    path === "/dashboard" ||
    path === "/subjects" ||
    path.startsWith("/subjects/") ||
    path === "/planner" ||
    path === "/focus" ||
    path === "/ai" ||
    path === "/progress" ||
    path === "/profile" ||
    path === "/settings" ||
    path === "/friends" ||
    path === "/chat"
  );
}

function AuthenticatedRoutes() {
  const { user, isLoading } = useAuth();
  const [location, navigate] = useLocation();

  useEffect(() => {
    if (isLoading) return;
    const publicPaths = ["/", "/login", "/register", "/forgot-password"];
    if (!user) {
      if (isKnownProtectedPath(location)) {
        navigate("/login");
      }
    } else if (!user.onboardingComplete) {
      if (location !== "/onboarding") {
        navigate("/onboarding");
      }
    } else if (publicPaths.includes(location)) {
      navigate("/dashboard");
    }
  }, [user, isLoading, location, navigate]);

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={LandingPage} />
        <Route path="/login" component={LoginPage} />
        <Route path="/register" component={RegisterPage} />
        <Route path="/forgot-password" component={ForgotPasswordPage} />
        <Route path="/onboarding" component={OnboardingPage} />
        <Route path="/dashboard">
          <AppLayout><DashboardPage /></AppLayout>
        </Route>
        <Route path="/subjects">
          <AppLayout><SubjectsPage /></AppLayout>
        </Route>
        <Route path="/subjects/:id">
          <AppLayout><SubjectDetailPage /></AppLayout>
        </Route>
        <Route path="/planner">
          <AppLayout><PlannerPage /></AppLayout>
        </Route>
        <Route path="/focus">
          <AppLayout><FocusPage /></AppLayout>
        </Route>
        <Route path="/ai">
          <AppLayout><AIAssistantPage /></AppLayout>
        </Route>
        <Route path="/progress">
          <AppLayout><ProgressPage /></AppLayout>
        </Route>
        <Route path="/profile">
          <AppLayout><ProfilePage /></AppLayout>
        </Route>
        <Route path="/settings">
          <AppLayout><SettingsPage /></AppLayout>
        </Route>
        <Route path="/friends">
          <AppLayout><FriendsPage /></AppLayout>
        </Route>
        <Route path="/chat">
          <AppLayout><ChatPage /></AppLayout>
        </Route>
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LanguageProvider>
          <TooltipProvider>
            <AuthProvider>
              <Toaster />
              <AuthenticatedRoutes />
            </AuthProvider>
          </TooltipProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
