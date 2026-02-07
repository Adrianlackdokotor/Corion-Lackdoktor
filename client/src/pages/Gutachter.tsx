
import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { 
  ShieldCheck, Car, Brain, Wrench, FileText, Phone, Mail, MapPin, 
  ArrowRight, CheckCircle, Menu, X, MessageSquare 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Gutachter() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { toast } = useToast();
  
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();
  
  const submitContact = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("POST", "/api/gutachter/contact", {
        ...data,
        requestType: "gutachten"
      });
    },
    onSuccess: () => {
      toast({ title: "Anfrage gesendet", description: "Wir melden uns in Kürze bei Ihnen." });
      reset();
    },
    onError: () => {
      toast({ title: "Fehler", description: "Bitte versuchen Sie es später erneut.", variant: "destructive" });
    }
  });

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
      setMobileMenuOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#111827] text-[#e5e7eb] font-sans selection:bg-[#c00000] selection:text-white">
      
      {/* 1. STICKY NAVIGATIE */}
      <nav className="sticky top-0 z-50 w-full backdrop-blur-md bg-[#111827]/95 border-b border-gray-800">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
            <div 
              onClick={() => window.location.reload()} 
              className="font-bold text-2xl text-white cursor-pointer flex items-center gap-2"
            >
               <span className="text-[#c00000]">CORION</span> GUTACHTER
            </div>

            <div className="hidden lg:flex items-center gap-6 text-sm font-medium">
                <button onClick={() => scrollTo('hero')} className="hover:text-[#c00000] transition">Start</button>
                <button onClick={() => scrollTo('leistungen')} className="hover:text-[#c00000] transition">Leistungen</button>
                <button onClick={() => scrollTo('ueber-uns')} className="hover:text-[#c00000] transition">Über Uns</button>
                <button onClick={() => scrollTo('unfall-assistent')} className="hover:text-[#c00000] transition text-[#c00000] flex gap-1 items-center"><Brain className="w-4 h-4"/> KI-Assistent</button>
                <button onClick={() => scrollTo('standorte')} className="hover:text-[#c00000] transition">Standorte</button>
                <button onClick={() => scrollTo('kontakt')} className="hover:text-[#c00000] transition">Kontakt</button>
                <Link href="/partner">
                    <Button className="bg-[#c00000] hover:bg-[#a00000] text-white rounded-full px-6">
                        Gutachter-Portal
                    </Button>
                </Link>
            </div>

            <button className="lg:hidden text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                {mobileMenuOpen ? <X /> : <Menu />}
            </button>
        </div>

        {mobileMenuOpen && (
            <div className="lg:hidden bg-[#1f2937] border-t border-gray-800 p-4 space-y-4">
                <button onClick={() => scrollTo('hero')} className="block w-full text-left py-2 hover:text-[#c00000]">Start</button>
                <button onClick={() => scrollTo('leistungen')} className="block w-full text-left py-2 hover:text-[#c00000]">Leistungen</button>
                <button onClick={() => scrollTo('kontakt')} className="block w-full text-left py-2 hover:text-[#c00000]">Kontakt</button>
                <Link href="/partner">
                    <Button className="w-full bg-[#c00000] hover:bg-[#a00000]">Gutachter-Portal</Button>
                </Link>
            </div>
        )}
      </nav>

      {/* 2. HERO SECTION */}
      <section id="hero" className="relative h-[90vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0 bg-gray-900">
           <div className="absolute inset-0 bg-gradient-to-b from-[#111827]/80 to-[#111827] z-10" />
           <img src="https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&q=80" alt="Car inspection" className="w-full h-full object-cover opacity-40 mix-blend-overlay" />
        </div>

        <div className="container mx-auto px-4 z-20 text-center relative">
            <motion.h1 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
                className="text-4xl md:text-6xl font-extrabold text-white mb-6 leading-tight"
            >
                Ihr Partner für Kfz-Gutachten <br/> im <span className="text-[#c00000]">Rhein-Main-Gebiet</span>
            </motion.h1>
            <motion.p 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3, duration: 0.8 }}
                className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto"
            >
                Schnell, professionell und unabhängig. Wir erstellen Schadengutachten und Wertgutachten für Ihr Fahrzeug in Frankfurt, Hofheim, Wiesbaden & Mainz.
            </motion.p>
            
            <motion.div 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                className="flex flex-col sm:flex-row gap-4 justify-center"
            >
                <Button onClick={() => scrollTo('leistungen')} size="lg" className="bg-[#c00000] hover:bg-[#a00000] text-white text-lg px-8 py-6 rounded-full shadow-[0_0_20px_rgba(192,0,0,0.4)] transition-transform hover:scale-105">
                    Unsere Leistungen
                </Button>
                <Button onClick={() => scrollTo('kontakt')} size="lg" variant="outline" className="border-gray-500 text-white hover:bg-white/10 text-lg px-8 py-6 rounded-full">
                    Direkt anfragen
                </Button>
            </motion.div>
        </div>
      </section>

      {/* 3. LEISTUNGEN SECTION */}
      <section id="leistungen" className="py-20 bg-[#111827]">
        <div className="container mx-auto px-4">
            <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Unsere Expertise</h2>
                <div className="w-24 h-1 bg-[#c00000] mx-auto rounded-full" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {SERVICES.map((service, index) => (
                    <ServiceCard key={index} {...service} />
                ))}
            </div>
        </div>
      </section>

      {/* 4. UEBER UNS */}
      <section id="ueber-uns" className="py-20 bg-[#1f2937] relative overflow-hidden">
         <div className="container mx-auto px-4 flex flex-col lg:flex-row gap-12 items-center">
            <div className="lg:w-[65%] space-y-6">
                <h2 className="text-3xl font-bold text-white">Über Corion Gutachter</h2>
                <p className="text-gray-300 leading-relaxed">
                    Mit über 25 Jahren Erfahrung in der Kfz-Branche stehen wir für Präzision und Unabhängigkeit. 
                    Unser Team kombiniert traditionelles Handwerk mit modernster KI-Technologie, um Ihnen 
                    Gutachten zu liefern, die jeder Prüfung standhalten.
                </p>
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                        <CheckCircle className="text-[#c00000]" /> <span>Zertifizierte Experten</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <CheckCircle className="text-[#c00000]" /> <span>24h Express-Service</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <CheckCircle className="text-[#c00000]" /> <span>Modernste Diagnostik</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <CheckCircle className="text-[#c00000]" /> <span>Versicherungs-Partner</span>
                    </div>
                </div>
                <div className="pt-6 flex gap-4">
                    <Link href="/ueber-uns"><Button variant="link" className="text-white hover:text-[#c00000] p-0">Mehr erfahren &rarr;</Button></Link>
                    <Button onClick={() => scrollTo('kontakt')} className="bg-[#c00000] hover:bg-[#a00000]">Kontakt aufnehmen</Button>
                </div>
            </div>
            <div className="lg:w-[35%] relative h-[400px] w-full bg-gray-800 rounded-2xl overflow-hidden border border-gray-700 shadow-2xl">
                 <img src="https://images.unsplash.com/photo-1599256829735-16298f6d3d4b?auto=format&fit=crop&q=80" alt="Team" className="w-full h-full object-cover" />
            </div>
         </div>
      </section>

      {/* 5. KI-UNFALL-ASSISTENT */}
      <section id="unfall-assistent" className="py-20 bg-gradient-to-r from-black to-[#1f2937] relative">
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
         <div className="container mx-auto px-4 relative z-10 text-center">
             <Brain className="w-16 h-16 text-[#c00000] mx-auto mb-6 animate-pulse" />
             <h2 className="text-3xl font-bold mb-4">KI-Unfall-Assistent</h2>
             <p className="text-gray-300 max-w-2xl mx-auto mb-8">
                Hatten Sie einen Unfall? Unser KI-Bot hilft Ihnen sofort mit einer ersten Einschätzung und Checkliste.
                Kostenlos und unverbindlich.
             </p>
             
             <div className="max-w-md mx-auto bg-[#111827] p-6 rounded-xl border border-gray-700 shadow-lg">
                <div className="flex items-center gap-3 mb-4 border-b border-gray-800 pb-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="font-mono text-sm text-green-500">SYSTEM ONLINE</span>
                </div>
                <p className="text-left text-sm text-gray-400 mb-4">
                    "Hallo! Ich bin der Corion AI. Beschreiben Sie kurz den Schaden, und ich sage Ihnen, was zu tun ist."
                </p>
                <Button className="w-full bg-[#c00000] hover:bg-[#a00000]" onClick={() => scrollTo('kontakt')}>
                    Ratgeber jetzt starten
                </Button>
             </div>
             
             <p className="mt-8 text-sm text-gray-500">
                Hinweis: Eine KI ersetzt keine <button onClick={() => scrollTo('kontakt')} className="text-[#c00000] underline">professionelle Begutachtung</button>.
             </p>
         </div>
      </section>

      {/* 6. STANDORTE */}
      <section id="standorte" className="py-20 bg-[#111827]">
        <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Unsere Standorte</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {LOCATIONS.map((loc, idx) => (
                    <LocationCard key={idx} {...loc} />
                ))}
            </div>
        </div>
      </section>

      {/* 7. KONTAKT */}
      <section id="kontakt" className="py-20 bg-[#1f2937]">
         <div className="container mx-auto px-4 grid lg:grid-cols-2 gap-12">
            <div>
                <h2 className="text-3xl font-bold mb-6">Kontaktieren Sie uns</h2>
                <p className="text-gray-400 mb-8">
                    Füllen Sie das Formular aus oder nutzen Sie WhatsApp für den schnellsten Weg.
                    Wir antworten in der Regel innerhalb von 60 Minuten.
                </p>
                
                <div className="space-y-6">
                    <a href="tel:+4917683458274" className="flex items-center gap-4 p-4 bg-[#111827] rounded-lg border border-gray-800 hover:border-[#c00000] transition">
                        <Phone className="text-[#c00000]" />
                        <div>
                            <div className="text-sm text-gray-500">Telefon (24/7 Notfall)</div>
                            <div className="font-bold">+49 176 83458274</div>
                        </div>
                    </a>
                    
                    <a href="mailto:info@corion-gutachter.de" className="flex items-center gap-4 p-4 bg-[#111827] rounded-lg border border-gray-800 hover:border-[#c00000] transition">
                        <Mail className="text-[#c00000]" />
                        <div>
                            <div className="text-sm text-gray-500">E-Mail</div>
                            <div className="font-bold">info@corion-gutachter.de</div>
                        </div>
                    </a>

                    <a href="https://wa.me/4917683458274?text=Hallo%20Corion%20Gutachter" target="_blank" className="flex items-center gap-4 p-4 bg-[#25D366]/10 rounded-lg border border-[#25D366]/30 hover:bg-[#25D366]/20 transition group">
                        <MessageSquare className="text-[#25D366]" />
                        <div>
                            <div className="text-sm text-[#25D366] font-bold group-hover:underline">Direkt per WhatsApp kontaktieren</div>
                        </div>
                    </a>
                </div>
            </div>

            {/* Formular */}
            <Card className="bg-[#111827] border-gray-800">
                <CardHeader>
                    <CardTitle>Anfrage senden</CardTitle>
                    <CardDescription>Kostenlos & Unverbindlich</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit((data) => submitContact.mutate(data))} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Name</label>
                                <Input {...register("name")} placeholder="Max Mustermann" className="bg-[#1f2937] border-gray-700" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Telefon</label>
                                <Input {...register("phone")} placeholder="+49..." className="bg-[#1f2937] border-gray-700" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">E-Mail</label>
                            <Input {...register("email")} type="email" placeholder="max@beispiel.de" className="bg-[#1f2937] border-gray-700" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Nachricht / Schaden</label>
                            <Textarea {...register("message")} placeholder="Unfallhergang, Fahrzeugtyp..." className="bg-[#1f2937] border-gray-700 min-h-[120px]" />
                        </div>
                        
                        <Button type="submit" disabled={isSubmitting} className="w-full bg-[#c00000] hover:bg-[#a00000] text-lg py-6">
                            {isSubmitting ? "Wird gesendet..." : "Nachricht senden"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
         </div>
      </section>

      {/* 8. FOOTER */}
      <footer className="bg-black py-8 border-t border-gray-900 text-center text-gray-500 text-sm">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
            <div>&copy; 2025 Corion GmbH. Alle Rechte vorbehalten.</div>
            <div className="flex gap-6">
                <button className="hover:text-white">Impressum</button>
                <button className="hover:text-white">Datenschutz</button>
            </div>
            <Link href="/" className="hover:text-[#c00000] transition">Zurück zu Lackdoktor</Link>
        </div>
      </footer>

      {/* FLOATING BUTTONS */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-4 z-40">
        <a href="https://wa.me/4917683458274" target="_blank" className="bg-[#25D366] p-4 rounded-full shadow-lg hover:scale-110 transition-transform">
            <MessageSquare className="text-white w-6 h-6" />
        </a>
        <button className="bg-[#c00000] p-4 rounded-full shadow-lg hover:scale-110 transition-transform">
            <Brain className="text-white w-6 h-6" />
        </button>
      </div>

      {/* MOBILE STICKY FOOTER */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#1f2937] border-t border-gray-800 p-3 flex justify-between gap-2 z-50">
        <a href="tel:+4917683458274" className="flex-1 bg-gray-800 text-white py-2 rounded text-center text-sm font-medium border border-gray-700">Anrufen</a>
        <a href="https://wa.me/4917683458274" className="flex-1 bg-[#25D366] text-white py-2 rounded text-center text-sm font-medium">WhatsApp</a>
        <Link href="/partner" className="flex-1 bg-[#c00000] text-white py-2 rounded text-center text-sm font-medium">Portal</Link>
      </div>

    </div>
  );
}

function ServiceCard({ icon: Icon, title, desc, id }: any) {
    return (
        <motion.div 
            whileHover={{ y: -5 }}
            className="bg-[#1f2937] p-6 rounded-xl border border-gray-700 shadow-lg hover:shadow-[0_10px_15px_rgba(192,0,0,0.3)] transition-all cursor-pointer group"
            onClick={() => {
                const el = document.getElementById(id);
                if (el) el.scrollIntoView({ behavior: 'smooth'});
            }}
        >
            <div className="w-12 h-12 bg-[#111827] rounded-lg flex items-center justify-center mb-4 group-hover:bg-[#c00000] transition-colors">
                <Icon className="w-6 h-6 text-[#c00000] group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-white">{title}</h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">{desc}</p>
            <div className="text-[#c00000] font-medium flex items-center gap-1 text-sm group-hover:translate-x-1 transition-transform">
                Mehr erfahren <ArrowRight className="w-4 h-4" />
            </div>
        </motion.div>
    );
}

function LocationCard({ city, address, mapLink }: any) {
    return (
        <Card className="bg-[#1f2937] border-gray-700 overflow-hidden group">
            <div className="h-32 bg-gray-800 relative">
                 <div className="absolute inset-0 flex items-center justify-center text-gray-600 bg-gray-900">
                    <MapPin className="w-8 h-8 opacity-50" />
                 </div>
            </div>
            <CardContent className="p-4">
                <h3 className="font-bold text-lg text-white mb-1">{city}</h3>
                <p className="text-sm text-gray-400 mb-4">{address}</p>
                
                <div className="grid grid-cols-2 gap-2">
                    <a href={mapLink} target="_blank" className="col-span-2 w-full bg-gray-800 hover:bg-gray-700 text-white text-xs py-2 rounded text-center border border-gray-600 transition">
                        Route planen
                    </a>
                    <a href="tel:+4917683458274" className="bg-gray-800 hover:bg-gray-700 text-white text-xs py-2 rounded text-center border border-gray-600">
                        Anrufen
                    </a>
                    <a href={`https://wa.me/4917683458274?text=Anfrage%20${city}`} target="_blank" className="bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs py-2 rounded text-center">
                        WhatsApp
                    </a>
                </div>
            </CardContent>
        </Card>
    );
}

const SERVICES = [
    { id: "schadengutachten", icon: ShieldCheck, title: "Unfall- & Schadensgutachten", desc: "Präzise Gutachten zur Beweissicherung und Schadensregulierung. Von Versicherungen anerkannt." },
    { id: "wertgutachten", icon: Car, title: "Restwert- & Marktwertgutachten", desc: "Marktgerechte Wertermittlung für Gebrauchtwagen, Unfallwagen und Oldtimer." },
    { id: "ki-analyse", icon: Brain, title: "Digitale & KI-Analyse", desc: "Aufspüren von Rahmenverziehungen und Strukturschäden durch modernste KI-gestützte Verfahren." },
    { id: "karosserie", icon: Wrench, title: "Karosserie & Lack Expertise", desc: "Expertise aus über 25 Jahren Erfahrung für eine umfassende Schadensbeurteilung." },
    { id: "erstberatung", icon: FileText, title: "Kostenlose Erstberatung", desc: "Unverbindliche und kostenfreie Erstberatung zu Ihrem Schadenfall." },
    { id: "kostenvoranschlag", icon: FileText, title: "Qualifizierte Kostenvoranschläge", desc: "Ideal zur Abrechnung von Bagatellschäden direkt mit der Versicherung." },
];

const LOCATIONS = [
    { city: "Frankfurt am Main", address: "Hauptwache 1, 60313", mapLink: "https://maps.google.com/?q=Frankfurt+am+Main+Corion+Gutachter" },
    { city: "Hofheim am Taunus", address: "Nordring 15, 65719", mapLink: "https://maps.google.com/?q=Hofheim+am+Taunus+Corion+Gutachter" },
    { city: "Wiesbaden", address: "Biebricher Allee 2, 65187", mapLink: "https://maps.google.com/?q=Wiesbaden+Corion+Gutachter" },
    { city: "Mainz", address: "Rheinallee 88, 55118", mapLink: "https://maps.google.com/?q=Mainz+Corion+Gutachter" },
];
