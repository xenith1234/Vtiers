import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth-context";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home";
import LeaderboardPage from "@/pages/leaderboard";
import PlayerPage from "@/pages/player";
import SearchPage from "@/pages/search";
import LoginPage from "@/pages/auth/login";
import RegisterPage from "@/pages/auth/register";
import ForgotPasswordPage from "@/pages/auth/forgot-password";
import AdminDashboardPage from "@/pages/admin/dashboard";
import AdminUsersPage from "@/pages/admin/users";
import AdminPlayersPage from "@/pages/admin/players";
import AdminGamemodesPage from "@/pages/admin/gamemodes";
import AdminRankingsPage from "@/pages/admin/rankings";
import AdminBadgesPage from "@/pages/admin/badges";
import AdminSettingsPage from "@/pages/admin/settings";
import AdminAnnouncementsPage from "@/pages/admin/announcements";
import AdminApiKeysPage from "@/pages/admin/api-keys";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30000 },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/leaderboard" component={LeaderboardPage} />
      <Route path="/players/:id" component={PlayerPage} />
      <Route path="/search" component={SearchPage} />
      <Route path="/auth/login" component={LoginPage} />
      <Route path="/auth/register" component={RegisterPage} />
      <Route path="/auth/forgot-password" component={ForgotPasswordPage} />
      <Route path="/admin" component={AdminDashboardPage} />
      <Route path="/admin/users" component={AdminUsersPage} />
      <Route path="/admin/players" component={AdminPlayersPage} />
      <Route path="/admin/gamemodes" component={AdminGamemodesPage} />
      <Route path="/admin/rankings" component={AdminRankingsPage} />
      <Route path="/admin/badges" component={AdminBadgesPage} />
      <Route path="/admin/settings" component={AdminSettingsPage} />
      <Route path="/admin/announcements" component={AdminAnnouncementsPage} />
      <Route path="/admin/api-keys" component={AdminApiKeysPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
