import { useState } from "react";
import { Search, Play, Headphones, FileText, BookOpen, Bot, Brain, Sparkles, Wrench, GraduationCap, Award, Users, Clock, CheckCircle, ArrowRight, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import SEO from "@/components/SEO";
import paintMasterBanner from "@assets/generated_images/AI_PaintMaster_GPT_avatar_0d76b779.png";
import smartRepairCourseImg from "@assets/Beilackieren_1761515825845.jpg";

const categories = [
  { label: "Alle", value: "all" },
  { label: "Lackierung", value: "Lackierung" },
  { label: "Smart Repair", value: "Smart Repair" },
  { label: "Karosserie", value: "Karosserie" },
  { label: "Gutachten", value: "Gutachten" },
  { label: "Management", value: "Management" },
  { label: "Marketing", value: "Marketing" },
];

const typeFilters = [
  { label: "Alle", value: "all" },
  { label: "Video", value: "video" },
  { label: "Audio", value: "audio" },
  { label: "PDF", value: "pdf" },
  { label: "Text", value: "text" },
];

const demoResources = [
  { type: "video", title: "Smart Repair Grundlagen - Einführung", category: "Smart Repair", duration: "45 Min", description: "Lernen Sie die Grundlagen der professionellen Spot- und Smart-Repair-Technik." },
  { type: "pdf", title: "Handbuch: SATA Lackierpistole Einstellung", category: "Lackierung", pages: 120, description: "Vollständiges Handbuch für die professionelle Einstellung und Wartung." },
  { type: "audio", title: "Podcast: Kundenservice im Handwerk", category: "Management", duration: "30 Min", description: "Tipps für exzellenten Kundenservice in der Werkstatt." },
  { type: "video", title: "Lackvorbereitung: Schleifen & Grundieren", category: "Lackierung", duration: "1 Std 15 Min", description: "Schritt-für-Schritt Anleitung zur professionellen Lackvorbereitung." },
  { type: "video", title: "Karosserie-Richtbank: Einführung", category: "Karosserie", duration: "55 Min", description: "Grundlagen der Karosserievermessung und Richtbanktechnik." },
  { type: "pdf", title: "Gutachten erstellen: Leitfaden", category: "Gutachten", pages: 45, description: "Praxisleitfaden für die Erstellung von Kfz-Schadengutachten." },
];

function getTypeGradient(type: string) {
  switch (type) {
    case "video": return "from-blue-600 to-blue-900";
    case "audio": return "from-purple-600 to-purple-900";
    case "pdf": return "from-red-600 to-red-900";
    case "text": return "from-green-600 to-green-900";
    default: return "from-gray-600 to-gray-900";
  }
}

function getTypeIcon(type: string) {
  switch (type) {
    case "video": return Play;
    case "audio": return Headphones;
    case "pdf": return FileText;
    case "text": return BookOpen;
    default: return FileText;
  }
}

function getTypeLabel(type: string) {
  switch (type) {
    case "video": return "Video";
    case "audio": return "Audio";
    case "pdf": return "PDF";
    case "text": return "Text";
    default: return type;
  }
}

function ResourceCard({ resource, index }: { resource: any; index: number }) {
  const Icon = getTypeIcon(resource.type);
  const gradient = getTypeGradient(resource.type);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      data-testid={`card-resource-${index}`}
    >
      <Card className="overflow-visible hover-elevate group cursor-pointer transition-transform duration-200 hover:scale-[1.02]">
        <div className={`relative aspect-video bg-gradient-to-br ${gradient} rounded-t-xl flex items-center justify-center`}>
          <Icon className="w-12 h-12 text-white/40" />
          <Badge className="absolute top-3 right-3 text-xs" variant="secondary">
            <Icon className="w-3 h-3 mr-1" />
            {getTypeLabel(resource.type)}
          </Badge>
          {(resource.duration || resource.pages) && (
            <span className="absolute bottom-3 right-3 text-xs text-white/80 bg-black/50 px-2 py-1 rounded">
              {resource.duration || `${resource.pages} Seiten`}
            </span>
          )}
        </div>
        <CardContent className="p-4">
          <h3 className="font-bold mb-1 line-clamp-1" data-testid={`text-resource-title-${index}`}>{resource.title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{resource.description}</p>
          <Badge variant="outline" className="text-xs">{resource.category}</Badge>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function Academy() {
  const [searchQuery, setSearchQuery] = useState("");
  const [aiAnswer, setAiAnswer] = useState<{ answer: string; sources: any[] } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeType, setActiveType] = useState("all");

  const { data: resources = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/academy/resources', activeCategory, activeType],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (activeCategory !== 'all') params.set('category', activeCategory);
      if (activeType !== 'all') params.set('type', activeType);
      const res = await fetch(`/api/academy/resources?${params}`);
      return res.json();
    },
  });

  const handleAskAI = async () => {
    if (!searchQuery.trim() || searchQuery.trim().length < 5) return;
    setIsSearching(true);
    setAiAnswer(null);
    try {
      const res = await fetch("/api/academy/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: searchQuery }),
      });
      const data = await res.json();
      setAiAnswer(data);
    } catch {
      setAiAnswer({ answer: "Es gab einen Fehler bei der Anfrage. Bitte versuchen Sie es erneut.", sources: [] });
    } finally {
      setIsSearching(false);
    }
  };

  const hasResources = resources.length > 0;

  const courses = [
    {
      icon: Sparkles,
      title: "Kratzerpolitur am Auto - Online Kurs",
      duration: "4,5 Stunden",
      price: "39€",
      description: "Professionelle Fahrzeugaufbereitung mit System. Lerne die Entfernung von Kratzern, Hohlogrammen und matten Stellen.",
      topics: [
        "Schleiftechnik mit P1500 & P3000",
        "Professionelle Poliertechniken",
        "3M Produkte & Materialauswahl",
        "Versiegelung & Nachbehandlung"
      ],
      ideal: "Ideal für: Anfänger & Profis, die professionelle Polierfahigkeiten erlernen wollen.",
      link: "/academy/kratzerpolitur-kurs",
      badge: "Online"
    },
    {
      icon: Wrench,
      title: "Smart Repair Grundlagen",
      duration: "2 Tage",
      description: "Lerne die wichtigsten Schritte der professionellen Spot- und Smart-Repair-Technik für kleine Lackschäden.",
      topics: [
        "Spot Repair Technik",
        "Materialauswahl & Oberflächenvorbereitung",
        "Farbtonfindung & Mischsysteme",
        "Qualitätskontrolle & Dokumentation"
      ],
      ideal: "Ideal für: Einsteiger, die präzise, schnelle und kosteneffiziente Reparaturen durchführen wollen."
    },
    {
      icon: Award,
      title: "Lackiertechnik Fortgeschritten",
      duration: "3 Tage",
      description: "Vertiefe dein Wissen über moderne Mehrschicht- und Effektlackierungen. Perfektioniere dein Finish mit AI-gestützter Fehleranalyse.",
      topics: [
        "Mehrschichtlackierung & Effektlacke",
        "Airbrush & Spezialbeschichtungen",
        "Polieren & Finish auf OEM-Niveau",
        "Lackfehler erkennen & vermeiden"
      ],
      ideal: "Ideal für: Profis, die Qualität und Geschwindigkeit optimieren wollen."
    },
    {
      icon: Wrench,
      title: "Dellen- und Drucktechnik (PDR)",
      duration: "3 Tage",
      description: "Lerne die Kunst der Dellenentfernung ohne Lackieren – eine der gefragtesten Kompetenzen im modernen Karosseriebereich.",
      topics: [
        "Werkzeugkunde & Hebeltechniken",
        "Aluminium & Stahl – Unterschiede in der Verarbeitung",
        "Temperaturführung & Lichttechnik",
        "Dellenanalyse mit AI-Unterstützung"
      ],
      ideal: "Ideal für: Karosseriebauer, Lackierer, Detailer & Smart-Repair-Techniker."
    },
    {
      icon: Sparkles,
      title: "Fahrzeugaufbereitung & Finish Excellence",
      duration: "2 Tage",
      description: "Werde zum Aufbereitungsprofi mit System! Vom Innenraum bis zum Hochglanz-Finish – perfekt vorbereitet durch praxisnahe Übungen und AI-Unterstützung.",
      topics: [
        "Lackreinigung & Schleiftechnik",
        "Polituren & Versiegelungen",
        "Innenraumaufbereitung & Lederpflege",
        "Glanzmessung & Qualitätsprüfung"
      ],
      ideal: "Ideal für: Aufbereiter & Smart Repair Werkstätten."
    },
    {
      icon: BookOpen,
      title: "Gutachter Ausbildung (Zertifiziert)",
      duration: "5 Tage",
      description: "Erhalte deine anerkannte Zertifizierung als KFZ-Gutachter mit praxisnaher Erfahrung und digitaler Dokumentation.",
      topics: [
        "Schadenanalyse & Bewertung",
        "Kalkulation & Dokumentation mit AI-Unterstützung",
        "Rechtliche Grundlagen & Kommunikation",
        "Praktische Gutachtenübungen"
      ],
      ideal: "Ideal für: Lackierer, Werkstattleiter, Versicherungsfachleute & Selbständige."
    },
  ];

  const benefits = [
    "Praxisnahe Ausbildung von erfahrenen Profis",
    "Modernste Werkstatt & Lackiertechnik",
    "Kleine Gruppen für intensives Lernen (max. 6 Teilnehmer)",
    "Zertifikat nach erfolgreichem Abschluss",
    "Flexible Termine & individuelle Schulungen",
    "Inklusive Materialien, Dokumentation & Support durch AI PaintMaster",
  ];

  const filteredDemoResources = demoResources.filter((r) => {
    if (activeCategory !== "all" && r.category !== activeCategory) return false;
    if (activeType !== "all" && r.type !== activeType) return false;
    return true;
  });

  return (
    <div className="min-h-screen">
      <SEO
        title="Corion Academy AI | Wissensbibliothek für Lackierung & Smart Repair"
        description="Deine zentrale Wissensbibliothek für Lackierung, Karosserie & Smart Repair. Frage unseren KI-Tutor - er kennt alle Kurse. Professionelle Weiterbildung mit AI-Unterstützung."
        canonical="https://www.corion-lackdoktor.de/academy"
      />

      {/* 1. Hero / AI Search Section */}
      <section className="w-full bg-card border-b py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <Brain className="w-10 h-10 text-[#c00000]" />
              <h1 className="text-4xl md:text-5xl font-bold font-heading" data-testid="text-academy-title">
                Corion Academy <span className="text-[#c00000]">AI</span>
              </h1>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10" data-testid="text-academy-subtitle">
              Deine zentrale Wissensbibliothek für Lackierung, Karosserie & Smart Repair. Frage unseren KI-Tutor – er kennt alle Kurse.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative max-w-3xl mx-auto"
          >
            <div className="relative flex items-center">
              <Search className="absolute left-5 w-5 h-5 text-muted-foreground z-10" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleAskAI(); }}
                placeholder="z.B. Wie lackiere ich Metallic-Flächen richtig?"
                className="w-full h-14 rounded-full pl-14 pr-32 bg-background border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#c00000]/50 text-base"
                data-testid="input-ai-search"
              />
              <Button
                onClick={handleAskAI}
                disabled={isSearching || searchQuery.trim().length < 5}
                className="absolute right-2 rounded-full bg-[#c00000] border-[#c00000] text-white"
                data-testid="button-ai-ask"
              >
                {isSearching ? (
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 animate-spin" />
                    Denkt...
                  </span>
                ) : (
                  "KI fragen"
                )}
              </Button>
            </div>
          </motion.div>

          {aiAnswer && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-6 max-w-3xl mx-auto"
            >
              <Card data-testid="card-ai-answer">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 text-left">
                    <div className="w-10 h-10 rounded-full bg-[#c00000]/10 flex items-center justify-center flex-shrink-0 mt-1">
                      <Bot className="w-5 h-5 text-[#c00000]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm leading-relaxed whitespace-pre-line" data-testid="text-ai-answer">{aiAnswer.answer}</p>
                      {aiAnswer.sources && aiAnswer.sources.length > 0 && (
                        <div className="mt-4 pt-3 border-t">
                          <p className="text-xs text-muted-foreground font-semibold mb-2">Quellen:</p>
                          <div className="flex flex-wrap gap-2">
                            {aiAnswer.sources.map((source: any, i: number) => (
                              <Badge key={i} variant="outline" className="text-xs" data-testid={`badge-source-${i}`}>
                                {source.title || source}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </section>

      {/* 2. Category Filter Bar */}
      <section className="w-full bg-background border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-hide">
            <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            {categories.map((cat) => (
              <Button
                key={cat.value}
                variant={activeCategory === cat.value ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveCategory(cat.value)}
                className={`flex-shrink-0 rounded-full ${activeCategory === cat.value ? "bg-[#c00000] border-[#c00000]" : ""}`}
                data-testid={`button-category-${cat.value}`}
              >
                {cat.label}
              </Button>
            ))}
          </div>

          {/* 3. Type Filter Tabs */}
          <div className="flex items-center gap-2 mt-3">
            {typeFilters.map((tf) => (
              <button
                key={tf.value}
                onClick={() => setActiveType(tf.value)}
                className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                  activeType === tf.value
                    ? "bg-foreground text-background font-semibold"
                    : "bg-muted text-muted-foreground hover-elevate"
                }`}
                data-testid={`button-type-${tf.value}`}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Resource Library Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <div className="aspect-video bg-muted rounded-t-xl" />
                <CardContent className="p-4 space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-full" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : hasResources ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resources.map((resource: any, index: number) => (
              <ResourceCard key={resource.id || index} resource={resource} index={index} />
            ))}
          </div>
        ) : (
          <>
            {/* Demo Resources Preview */}
            <div className="mb-16">
              <div className="flex items-center gap-3 mb-8">
                <Sparkles className="w-6 h-6 text-[#c00000]" />
                <h2 className="text-2xl md:text-3xl font-bold font-heading" data-testid="text-library-preview">Bibliothek Vorschau</h2>
              </div>
              {filteredDemoResources.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredDemoResources.map((resource, index) => (
                    <ResourceCard key={index} resource={resource} index={index} />
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">Keine Ressourcen für diese Filter gefunden.</p>
              )}
            </div>
          </>
        )}
      </section>

      {/* 5. Existing Courses Section */}
      <div className="bg-card py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold font-heading mb-12 text-center" data-testid="text-courses-heading">Unsere Kurse</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((course, index) => {
              const Icon = course.icon;
              return (
                <div key={index} className="bg-background p-6 rounded-md border hover-elevate flex flex-col">
                  <div className="flex items-start justify-between gap-2 mb-4 flex-wrap">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Icon className="w-8 h-8 text-primary" />
                    </div>
                    {course.price && <div className="text-xl font-bold text-primary">{course.price}</div>}
                  </div>
                  {course.badge && <Badge variant="secondary" className="mb-3 w-fit"><GraduationCap className="w-3 h-3 mr-1" />{course.badge}</Badge>}
                  <h3 className="text-xl font-bold mb-2">{course.title}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                    <Clock className="w-4 h-4" />
                    <span>{course.duration}</span>
                  </div>
                  <p className="text-muted-foreground mb-4 flex-1">{course.description}</p>
                  <div className="space-y-2 mb-4">
                    <p className="text-sm font-semibold">Kursinhalte:</p>
                    <ul className="space-y-1">
                      {course.topics.map((topic, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                          <span>{topic}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <p className="text-sm text-primary font-semibold mb-4">{course.ideal}</p>
                  {course.link && (
                    <Link href={course.link}>
                      <Button className="w-full" data-testid={`button-course-${index}`}>
                        {course.price ? "Warteliste" : "Mehr erfahren"}
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </Button>
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 6. Free Courses Section */}
      <div className="bg-background py-12 md:py-16 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold font-heading mb-4">Kostenlose Kurse & Lernbibliothek</h2>
            <p className="text-lg text-muted-foreground">
              Lerne von unseren Experten – kostenlos und praxisorientiert
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-card rounded-lg overflow-hidden border hover-elevate group"
            >
              <div className="aspect-video relative overflow-hidden">
                <img
                  src={smartRepairCourseImg}
                  alt="Smart Repair und Lackiertechnik Kurs bei Corion Lackdoktor"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                  <div className="flex items-center gap-2 text-white">
                    <Wrench className="w-5 h-5" />
                    <span className="font-semibold text-sm">Kostenloser Kurs</span>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-3">Einführung in Smart Repair & Lackiertechnik</h3>
                <p className="text-muted-foreground mb-4">
                  In diesem kostenlosen Einführungskurs lernst du die Grundlagen der Smart Repair Technik,
                  Farbtonanpassung und Oberflächenfinish. Ideal für Einsteiger und Profis, die ihre Fähigkeiten auffrischen möchten.
                </p>
                <Link href="/academy/smart-repair-einfuehrung">
                  <Button className="w-full" data-testid="button-course-smart-repair">
                    Jetzt starten
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-card rounded-lg overflow-hidden border opacity-60"
            >
              <div className="aspect-video bg-gradient-to-br from-muted/20 to-muted/5 flex items-center justify-center">
                <BookOpen className="w-16 h-16 text-muted-foreground" />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-3">Weitere Kurse folgen</h3>
                <p className="text-muted-foreground mb-4">
                  Bald verfügbar: Weitere kostenlose Kurse zu Lackierung, Politur und Fahrzeugaufbereitung.
                </p>
                <Button disabled className="w-full" data-testid="button-course-coming-soon">
                  Demnächst
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* 7. PaintMaster AI Section */}
      <section className="w-full bg-card border-b py-8 md:py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center gap-6">
          <motion.a
            href="https://chat.openai.com/g/g-OyZuqL3BE-paintmaster"
            target="_blank"
            rel="noopener noreferrer"
            className="block"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            data-testid="link-paintmaster-banner"
          >
            <img
              src={paintMasterBanner}
              alt="AI PaintMaster - Ihr persönlicher AI-Tutor für Smart Repair & Lackierung"
              className="w-full max-w-2xl rounded-xl shadow-lg cursor-pointer transition-shadow duration-300 hover:shadow-2xl"
            />
          </motion.a>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-center"
          >
            <h2 className="text-2xl md:text-3xl font-bold font-heading mb-4" data-testid="text-paintmaster-headline">
              AI PaintMaster – Dein digitaler Begleiter
            </h2>
            <p className="text-lg text-muted-foreground mb-4 max-w-2xl mx-auto">
              Dein persönlicher AI-Assistent begleitet dich während des Kurses und danach.
              Er merkt sich deine Projekte, bewertet deine Fortschritte und hilft dir,
              deine Fähigkeiten auf das nächste Level zu bringen.
            </p>
            <p className="text-xl font-bold font-heading text-primary">
              "Lernen. Üben. Verbessern. Und verdienen."
            </p>
          </motion.div>
        </div>
      </section>

      {/* 8. Benefits */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <h2 className="text-3xl font-bold font-heading mb-12 text-center">Deine Vorteile mit der Corion Academy</h2>
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {benefits.map((benefit, index) => (
            <div key={index} className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-lg">{benefit}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 9. CTA - Waitlist */}
      <div className="bg-primary text-primary-foreground py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Users className="w-16 h-16 mx-auto mb-6 opacity-90" />
          <h2 className="text-3xl md:text-4xl font-bold font-heading mb-6">
            Jetzt auf die Warteliste eintragen!
          </h2>
          <p className="text-lg mb-4 opacity-90">
            Erhalte Zugang zu Early-Bird-Plätzen, Bonusinhalten und AI-PaintMaster Tools zur Kursvorbereitung.
          </p>
          <div className="space-y-2 mb-8 opacity-90">
            <p className="flex items-center justify-center gap-2"><GraduationCap className="w-4 h-4" /> Ort: Wiesbaden & Umgebung</p>
            <p className="flex items-center justify-center gap-2"><Clock className="w-4 h-4" /> Flexible Termine | Kleine Gruppen (max. 6 Teilnehmer)</p>
            <p className="flex items-center justify-center gap-2"><Award className="w-4 h-4" /> Förderung durch Bildungsprämie möglich</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/kontakt">
              <Button size="lg" variant="secondary" data-testid="button-contact-academy">
                Jetzt auf Warteliste eintragen
              </Button>
            </Link>
            <a href="tel:017683458274">
              <Button size="lg" variant="outline" className="bg-primary-foreground/10 backdrop-blur-sm border-primary-foreground/30 text-primary-foreground" data-testid="button-call-academy">
                0176 834 582 74
              </Button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
