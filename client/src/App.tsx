import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "@/components/Layout";

import Home from "@/pages/Home";
import Contact from "@/pages/Contact";
import About from "@/pages/About";
import Testimonials from "@/pages/Testimonials";
import FAQ from "@/pages/FAQ";
import SmartRepair from "@/pages/services/SmartRepair";
import Unfallschaeden from "@/pages/services/Unfallschaeden";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/kontakt" component={Contact} />
      <Route path="/uber-uns" component={About} />
      <Route path="/bewertungen" component={Testimonials} />
      <Route path="/faq" component={FAQ} />
      <Route path="/leistungen/smart-repair" component={SmartRepair} />
      <Route path="/leistungen/unfallschaeden" component={Unfallschaeden} />
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Layout>
          <Router />
        </Layout>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
