import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "@/components/Layout";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";

import Home from "@/pages/Home";
import Contact from "@/pages/Contact";
import About from "@/pages/About";
import Testimonials from "@/pages/Testimonials";
import FAQ from "@/pages/FAQ";
import Gutachter from "@/pages/Gutachter";
import Locations from "@/pages/Locations";
import Gallery from "@/pages/Gallery";
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

import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/kontakt" component={Contact} />
      <Route path="/uber-uns" component={About} />
      <Route path="/bewertungen" component={Testimonials} />
      <Route path="/faq" component={FAQ} />
      <Route path="/gutachter" component={Gutachter} />
      <Route path="/standorte" component={Locations} />
      <Route path="/galerie" component={Gallery} />
      
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
        <FloatingWhatsApp />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
