import React from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AIMentorToaster, AIMentorDevPanel } from "@/components/AIMentorFeedback";
import { TooltipProvider } from "@/components/ui/tooltip";
import { HelmetProvider } from "react-helmet-async";
import Layout from "@/components/Layout";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";
import SmartTriageChat from "@/components/SmartTriageChat";
import CookieConsent from "@/components/CookieConsent";
import ThemeToggle from "@/components/ThemeToggle";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/hooks/use-auth";
import ClientDashboard from "@/pages/ClientDashboard";
import PartnerPortal from "@/pages/PartnerPortal";
import PartnerDashboard from "@/pages/PartnerDashboard";
import NewRepairRequest from "@/pages/NewRepairRequest";
import { useDynamicIntelligence } from "@/hooks/useDynamicIntelligence";
import { LanguageProvider } from "@/i18n/LanguageContext";

import Home from "@/pages/Home";
import CoriMobile from "@/pages/CoriMobile";
import Login from "@/pages/Login";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import HubDashboard from "@/pages/HubDashboard";
import ResourceScheduler from "@/pages/ResourceScheduler";
import AdminCalendar from "@/pages/AdminCalendar";
import DamageIntake from "@/pages/DamageIntake";
import AdminDashboard from "@/pages/AdminDashboard";
import FleetAdmin from "@/pages/FleetAdmin";
import AdminAgentTasks from "@/pages/AdminAgentTasks";
import AdminAgents from "@/pages/AdminAgents";
import AdminComms from "@/pages/AdminComms";
import AdminPartnerView from "@/pages/AdminPartnerView";
import AdminPartners from "@/pages/AdminPartners";
import Contact from "@/pages/Contact";
import About from "@/pages/About";
import Standorte from "@/pages/Standorte";
import FAQ from "@/pages/FAQ";
import Gutachter from "@/pages/Gutachter";
import Gallery from "@/pages/Gallery";
import Testimonials from "@/pages/Testimonials";
import Academy from "@/pages/Academy";
import SmartRepairCourse from "@/pages/SmartRepairCourse";
import Franchise from "@/pages/Franchise";
import PolishingCourse from "@/pages/PolishingCourse";
import CourseWaitlist from "@/pages/CourseWaitlist";
import Impressum from "@/pages/Impressum";
import Datenschutz from "@/pages/Datenschutz";
import Cookies from "@/pages/Cookies";

import SmartRepair from "@/pages/services/SmartRepair";
import Unfallschaeden from "@/pages/services/Unfallschaeden";
import Lackschaeden from "@/pages/services/Lackschaeden";
import DellenEntfernen from "@/pages/services/DellenEntfernen";
import Leasingruecklaufer from "@/pages/services/Leasingruecklaufer";
import Felgenreparaturen from "@/pages/services/Felgenreparaturen";
import Rostschaeden from "@/pages/services/Rostschaeden";
import Oldtimer from "@/pages/services/Oldtimer";
import Autoaufbereitung from "@/pages/services/Autoaufbereitung";
import Baulackierung from "@/pages/services/Baulackierung";
import Autoglas from "@/pages/services/Autoglas";
import Sonderlackierung from "@/pages/services/Sonderlackierung";
import Plastikreparatur from "@/pages/services/Plastikreparatur";
import Blog from "@/pages/Blog";
import BlogLeasingArticle from "@/pages/BlogLeasingArticle";
import BlogHistaArticle from "@/pages/BlogHistaArticle";
import BlogMeisterschuleArticle from "@/pages/BlogMeisterschuleArticle";
import RecruitmentFlyers from "@/pages/RecruitmentFlyers";
import HubCalculator from "@/pages/HubCalculator";
import HubFinance from "@/pages/HubFinance";
import AuftragCalculator from "@/pages/AuftragCalculator";
import FinancialDashboard from "@/pages/FinancialDashboard";
import FinanceDashboard from "@/pages/FinanceDashboard";
import OnboardingAgent from "@/pages/OnboardingAgent";
import CFOInbox from "@/pages/CFOInbox";
import ContabilAI from "@/pages/ContabilAI";
import AgentSelector from "@/components/AgentSelector";
import PrivacyAdmin from "@/pages/PrivacyAdmin";
import Landing from "@/pages/Landing";
import Wallet from "@/pages/Wallet";
import ClientSubmission from "@/pages/ClientSubmission";
import HubLanding from "@/pages/hub/HubLanding";
import HubPortal from "@/pages/hub/HubPortal";
import HubOnboarding from "@/pages/hub/HubOnboarding";
import HubApp from "@/pages/hub/HubApp";
import HubUsage from "@/pages/hub/HubUsage";
import HubBilling from "@/pages/hub/HubBilling";
import HubEarn from "@/pages/hub/HubEarn";
import TaskBoard from "@/pages/TaskBoard";
import { HubI18nProvider } from "@/lib/hubI18n";

import MercedesDoor from "@/pages/academy/courses/MercedesDoor";
import GamifiedDashboard from "@/pages/partner/GamifiedDashboard";
import Onboarding from "@/pages/partner/Onboarding";
import PartnerWorkshopOrders from "@/pages/PartnerWorkshopOrders";

import RepairOrderForm from "@/pages/RepairOrderForm";
import PublicPartnerProfile from "@/pages/PublicPartnerProfile";
import ReceptionApp from "@/pages/ReceptionApp";
import AuftragsListe from "@/pages/AuftragsListe";
import AdminPayoutGaps from "@/pages/AdminPayoutGaps";
import WorkshopWorkspace from "@/pages/WorkshopWorkspace";
import WorkshopOrderDetail from "@/pages/WorkshopOrderDetail";
import PartnerHub from "@/pages/PartnerHub";
import GutachterFunnel from "@/pages/GutachterFunnel";
import NotFound from "@/pages/not-found";

class RouteErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[RouteErrorBoundary]", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-6">
          <div className="max-w-2xl w-full rounded-xl border border-rose-800 bg-zinc-900 p-5">
            <div className="text-sm font-semibold text-rose-300 mb-2">Frontend runtime error</div>
            <div className="text-xs text-zinc-300 break-words">{this.state.error.message}</div>
            <pre className="mt-4 text-[10px] text-zinc-500 overflow-auto whitespace-pre-wrap">{this.state.error.stack}</pre>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function RouterContent() {
  return (
    <RouteErrorBoundary>
    <Switch>
      <Route path="/public-site" component={Home} />
      <Route path="/" component={DomainHome} />
      <Route path="/kontakt" component={Contact} />
      <Route path="/contact" component={Contact} />
      <Route path="/uber-uns" component={About} />
      <Route path="/standorte" component={Standorte} />
      <Route path="/faq" component={FAQ} />
      <Route path="/gutachter" component={Gutachter} />
      <Route path="/galerie" component={Gallery} />
      <Route path="/bewertungen" component={Testimonials} />
      <Route path="/academy/course/mercedes-door" component={MercedesDoor} />
      <Route path="/academy/smart-repair-einfuehrung" component={SmartRepairCourse} />
      <Route path="/academy/kratzerpolitur-kurs" component={PolishingCourse} />
      <Route path="/academy/kratzerpolitur-waitlist" component={CourseWaitlist} />
      <Route path="/academy" component={Academy} />
      <Route path="/franchise" component={Franchise} />
      <Route path="/partner-flyer" component={RecruitmentFlyers} />
      <Route path="/blog" component={Blog} />
      <Route path="/blog/leasingrueckgabe-sparen" component={BlogLeasingArticle} />
      <Route path="/blog/hista-franchise-digital-assets" component={BlogHistaArticle} />
      <Route path="/blog/meisterschule-projekt" component={BlogMeisterschuleArticle} />
      
      {/* Public Client Submission */}
      <Route path="/anfrage" component={ClientSubmission} />
      
      {/* Auth Pages */}
      <Route path="/login" component={Login} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />

      {/* CORI mobile-first PWA surface — full-screen, installable, no dashboard chrome */}
      <Route path="/cori" component={CoriMobile} />
      {/* Hub+1 ecosystem (premium AI landing + onboarding) */}
      <Route path="/portal" component={HubPortal} />
      <Route path="/hub/portal" component={HubPortal} />
      <Route path="/hub/onboarding" component={HubOnboarding} />
      <Route path="/hub/app" component={HubApp} />
      <Route path="/hub/usage" component={HubUsage} />
      <Route path="/hub/billing" component={HubBilling} />
      <Route path="/hub/earn" component={HubEarn} />
      <Route path="/tasks" component={TaskBoard} />
      <Route path="/hub/dashboard" component={HubDashboard} />
      <Route path="/hub/scheduler" component={ResourceScheduler} />
      <Route path="/admin/calendar" component={AdminCalendar} />
      <Route path="/hub/intake" component={DamageIntake} />
      <Route path="/hub/calculator" component={HubCalculator} />
      <Route path="/hub/finance" component={HubFinance} />
      <Route path="/finanzen/detail" component={FinancialDashboard} />
      <Route path="/finanzen" component={FinanceDashboard} />
      <Route path="/onboarding" component={OnboardingAgent} />
      <Route path="/cfo-inbox" component={CFOInbox} />
      <Route path="/contabil-ai" component={ContabilAI} />
      <Route path="/agent-hub" component={AgentSelector} />
      <Route path="/hub/auftrag" component={AuftragCalculator} />
      <Route path="/hub" component={HubLanding} />
      <Route path="/admin/partner/:id" component={AdminPartnerView} />
      <Route path="/admin/partners" component={AdminPartners} />
      <Route path="/admin/fleet" component={FleetAdmin} />
      <Route path="/admin/partner-payouts" component={AdminPayoutGaps} />
      <Route path="/admin/agent-tasks" component={AdminAgentTasks} />
      <Route path="/admin/agents" component={AdminAgents} />
      <Route path="/admin/comms" component={AdminComms} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/client" component={ClientDashboard} />
      <Route path="/client/new-request" component={NewRepairRequest} />
      <Route path="/partner/workshop-orders" component={PartnerWorkshopOrders} />
      <Route path="/repair-order" component={RepairOrderForm} />
      <Route path="/reception" component={ReceptionApp} />
      <Route path="/auftraege" component={AuftragsListe} />
      <Route path="/workshop" component={WorkshopWorkspace} />
      <Route path="/workshop/auftrag/:id" component={WorkshopOrderDetail} />
      <Route path="/partner-hub" component={PartnerHub} />
      <Route path="/gutachter-funnel" component={GutachterFunnel} />
      <Route path="/partner/dashboard" component={GamifiedDashboard} />
      <Route path="/partner/onboarding" component={Onboarding} />
      <Route path="/partner/legacy" component={PartnerPortal} />
      <Route path="/partner/:slug" component={PublicPartnerProfile} />
      <Route path="/partner" component={PartnerDashboard} />
      
      {/* Legal Pages */}
      <Route path="/impressum" component={Impressum} />
      <Route path="/datenschutz" component={Datenschutz} />
      <Route path="/cookies" component={Cookies} />
      
      {/* Service Pages */}
      <Route path="/leistungen/unfallschaeden" component={Unfallschaeden} />
      <Route path="/leistungen/lackschaeden" component={Lackschaeden} />
      <Route path="/leistungen/smart-repair" component={SmartRepair} />
      <Route path="/leistungen/dellen-entfernen" component={DellenEntfernen} />
      <Route path="/leistungen/leasingruecklaufer" component={Leasingruecklaufer} />
      <Route path="/leistungen/felgenreparaturen" component={Felgenreparaturen} />
      <Route path="/leistungen/rostschaeden" component={Rostschaeden} />
      <Route path="/leistungen/oldtimer" component={Oldtimer} />
      <Route path="/leistungen/autoaufbereitung" component={Autoaufbereitung} />
      <Route path="/leistungen/baulackierung" component={Baulackierung} />
      <Route path="/leistungen/autoglas" component={Autoglas} />
      <Route path="/leistungen/sonderlackierung" component={Sonderlackierung} />
      <Route path="/leistungen/plastikreparatur" component={Plastikreparatur} />
      
      {/* Privacy & IAM */}
      <Route path="/privacy-admin" component={PrivacyAdmin} />

      {/* Persona-aware marketing landing */}
      <Route path="/landing" component={Landing} />

      {/* HUB+1 Token Wallet */}
      <Route path="/wallet" component={Wallet} />

      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
    </RouteErrorBoundary>
  );
}

function DomainHome() {
  const hostname = typeof window === "undefined" ? "" : window.location.hostname.toLowerCase();
  return hostname === "app.corion.app" ? <Login /> : <ClientSubmission />;
}

const APP_ROUTES = ["/admin", "/partner", "/client", "/hub", "/portal", "/repair-order", "/reception", "/auftraege", "/workshop", "/partner-hub", "/finanzen", "/login", "/forgot-password", "/reset-password", "/onboarding", "/cfo-inbox", "/contabil-ai", "/agent-hub", "/privacy-admin", "/landing", "/wallet", "/tasks", "/admin/partner-payouts", "/cori"];
const RESERVED_PARTNER_PATHS = ["/partner/dashboard", "/partner/onboarding", "/partner/workshop-orders", "/partner/legacy", "/partner-hub"];

function AppShell() {
  const [location] = useLocation();
  // Public partner profile pages (e.g. /partner/hofheim) should render with the
  // public site chrome (floating WhatsApp / chat / cookie banner), not the app shell.
  const isPublicPartnerProfile =
    /^\/partner\/[^/]+$/.test(location) && !RESERVED_PARTNER_PATHS.includes(location);
  const isAppMode = APP_ROUTES.some(r => location.startsWith(r)) && !isPublicPartnerProfile;

  return (
    <>
      <Layout>
        <RouterContent />
      </Layout>
      {!isAppMode && <FloatingWhatsApp />}
      {!isAppMode && <SmartTriageChat />}
      {!isAppMode && <CookieConsent />}
      {!isAppMode && <ThemeToggle />}
      <Toaster />
      {isAppMode && <AIMentorToaster />}
      {/* Dev demo button — hidden inside Hub+1 / Portal routes to keep premium feel */}
      {isAppMode && !location.startsWith("/hub") && !location.startsWith("/portal") && !location.startsWith("/landing") && <AIMentorDevPanel />}
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <HubI18nProvider>
                <TooltipProvider>
                  <AppShell />
                </TooltipProvider>
              </HubI18nProvider>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </HelmetProvider>
    </QueryClientProvider>
  );
}

export default App;
