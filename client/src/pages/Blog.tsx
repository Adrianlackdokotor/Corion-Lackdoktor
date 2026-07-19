import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar, ArrowRight, Clock } from "lucide-react";
import { motion } from "framer-motion";
import SEO from "@/components/SEO";
import { useLanguage } from "@/i18n/LanguageContext";
import histaMercedesBg from "@/assets/images/blog/hista-mercedes-bg.png";

export default function Blog() {
  const { t, language } = useLanguage();

  const blogPosts = [
    {
      id: 8,
      titleDe: "Meisterschule Projekt: Vom Schulprojekt zum skalierbaren Business-System",
      titleEn: "Master School Project: From School Project to Scalable Business System",
      titleRo: "Proiect Meisterschule: De la Proiect Școlar la Sistem de Business Scalabil",
      descDe: "Wie ich ein Meisterschule-Projekt an der Forum HisTa in ein skalierbares Business-System für Fahrzeuglackierung verwandelt habe. Corporate Identity, digitale Plattform und handwerkliche Innovation.",
      descEn: "How I transformed a master school project at Forum HisTa into a scalable business system for vehicle painting. Corporate identity, digital platform and craft innovation.",
      descRo: "Cum am transformat un proiect de la Meisterschule Forum HisTa într-un sistem de business scalabil pentru vopsitorie auto. Identitate corporativă, platformă digitală și inovație artizanală.",
      date: "2026-02-01",
      readTime: "12 min",
      category: "Case Study",
      slug: "meisterschule-projekt",
      link: "/blog/meisterschule-projekt",
      featured: true
    },
    {
      id: 7,
      titleDe: "HISTA Franchise: Digitale Assets für Premium-Flottenbranding",
      titleEn: "HISTA Franchise: Digital Assets for Premium Fleet Branding",
      titleRo: "HISTA Franciză: Active Digitale pentru Branding Premium de Flotă",
      descDe: "Wie Sie mit unserem Franchise-Modell digitale Design-Assets erstellen, verkaufen und skalieren können – als One-Time-Kauf, Abonnement oder Token-basiert.",
      descEn: "How to create, sell and scale digital design assets with our franchise model – as one-time purchase, subscription or token-based.",
      descRo: "Cum să creați, vindeți și scalați active digitale de design cu modelul nostru de franciză – cumpărare unică, abonament sau bazat pe tokenuri.",
      date: "2026-02-01",
      readTime: "8 min",
      category: "Franchise",
      slug: "hista-franchise-digital-assets",
      link: "/blog/hista-franchise-digital-assets",
      featured: false
    },
    {
      id: 1,
      titleDe: "Warum Smart Repair Ihre beste Wahl ist",
      titleEn: "Why Smart Repair is Your Best Choice",
      titleRo: "De Ce Smart Repair Este Alegerea Ta Cea Mai Bună",
      descDe: "Erfahren Sie mehr über die Vorteile von Smart Repair gegenüber traditioneller Lackierung und wie viel Sie sparen können.",
      descEn: "Learn about the benefits of Smart Repair compared to traditional painting and how much you can save.",
      descRo: "Aflați mai multe despre avantajele Smart Repair comparativ cu vopseaua tradițională și cât puteți economisi.",
      date: "2024-11-28",
      readTime: "5 min",
      category: "Smart Repair",
      slug: "warum-smart-repair",
      featured: false
    },
    {
      id: 2,
      titleDe: "Leasingrückgabe? Sparen Sie bis zu 70% mit Spot-Repair",
      titleEn: "Lease Return? Save up to 70% with Spot-Repair",
      titleRo: "Returnarea Leasing? Economisiți până la 70% cu Spot-Repair",
      descDe: "Mit unserer Spot-Repair Technik lackieren wir nur den Kratzer – nicht das ganze Teil. Sparen Sie bis zu 70% gegenüber Komplettverlackierung bei der Leasingrückgabe.",
      descEn: "With our Spot-Repair technique, we only paint the scratch – not the entire part. Save up to 70% compared to full repainting at lease return.",
      descRo: "Cu tehnica noastră Spot-Repair, vopsim doar zgârietura – nu întreaga piesă. Economisiți până la 70% față de revopsirea completă la returnarea leasing.",
      date: "2024-11-25",
      readTime: "6 min",
      category: "Leasing",
      slug: "leasingrueckgabe-sparen",
      link: "/blog/leasingrueckgabe-sparen",
      featured: false
    },
    {
      id: 3,
      titleDe: "Professionelle Autoaufbereitung - Step-by-Step Guide",
      titleEn: "Professional Car Detailing - Step-by-Step Guide",
      titleRo: "Detailing Auto Profesional - Ghid Pas cu Pas",
      descDe: "Alles, was Sie über professionelle Autoaufbereitung wissen müssen.",
      descEn: "Everything you need to know about professional car detailing.",
      descRo: "Tot ce trebuie să știți despre detailing auto profesional.",
      date: "2024-11-22",
      readTime: "7 min",
      category: "Aufbereitung",
      slug: "autoaufbereitung-guide",
      featured: false
    },
    {
      id: 4,
      titleDe: "Oldtimer restaurieren - Handwerk trifft Leidenschaft",
      titleEn: "Restoring Classic Cars - Craftsmanship Meets Passion",
      titleRo: "Restaurare Mașini Clasice - Meșteșug Întâlnește Pasiune",
      descDe: "Wie wir Ihre klassischen Fahrzeuge mit modernster Technik und traditionellem Handwerk wiederherstellen.",
      descEn: "How we restore your classic vehicles with cutting-edge technology and traditional craftsmanship.",
      descRo: "Cum restaurăm vehiculele tale clasice cu tehnologie modernă și meșteșugul tradițional.",
      date: "2024-11-20",
      readTime: "6 min",
      category: "Oldtimer",
      slug: "oldtimer-restaurieren",
      featured: false
    },
    {
      id: 5,
      titleDe: "KI in der Lackschadenanalyse - Zukunft ist jetzt",
      titleEn: "AI in Paint Damage Analysis - The Future is Now",
      titleRo: "IA în Analiza Daunelor de Vopsea - Viitorul Este Acum",
      descDe: "Entdecken Sie, wie unsere KI-Technologie Lackschäden analysiert und präzise Kostenvoranschläge erstellt.",
      descEn: "Discover how our AI technology analyzes paint damage and creates accurate cost estimates.",
      descRo: "Descoperiți cum tehnologia noastră AI analizează daunele de vopsea și creează estimări precise de cost.",
      date: "2024-11-18",
      readTime: "5 min",
      category: "Technologie",
      slug: "ki-lackschadenanalyse",
      featured: false
    },
    {
      id: 6,
      titleDe: "Felgenreparatur vs. Neukauf - Was lohnt sich?",
      titleEn: "Wheel Repair vs. New Purchase - What's Worth It?",
      titleRo: "Reparare Jante vs. Achiziție Nouă - Ce Merită?",
      descDe: "Eine detaillierte Kosten-Nutzen-Analyse für die Entscheidung zwischen Felgenreparatur und Neukauf.",
      descEn: "A detailed cost-benefit analysis for deciding between wheel repair and new purchase.",
      descRo: "O analiză detaliată cost-beneficiu pentru decizia între repararea jantelor și achiziția nouă.",
      date: "2024-11-15",
      readTime: "4 min",
      category: "Felgen",
      slug: "felgenreparatur-vs-neukauf",
      featured: false
    }
  ];

  const getTitle = (post: typeof blogPosts[0]) => {
    return language === "en" ? post.titleEn : language === "ro" ? post.titleRo : post.titleDe;
  };

  const getDesc = (post: typeof blogPosts[0]) => {
    return language === "en" ? post.descEn : language === "ro" ? post.descRo : post.descDe;
  };

  const featuredPost = blogPosts.find(p => p.featured);
  const regularPosts = blogPosts.filter(p => !p.featured);

  return (
    <>
      <SEO 
        title={language === "en" ? "Blog - Corion Lackdoktor" : language === "ro" ? "Blog - Corion Lackdoktor" : "Blog - Corion Lackdoktor"}
        description={language === "en" ? "Read expert tips and insights about car repair, Smart Repair, and professional detailing." : language === "ro" ? "Citiți sfaturi de la experți și perspective despre repararea mașinilor, Smart Repair și detailing profesional." : "Lesen Sie Expertentipps und Einblicke zu Autoreparatur, Smart Repair und professioneller Aufbereitung."}
      />
      
      <main className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="py-16 md:py-24 border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              className="max-w-2xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-block text-primary font-semibold mb-4">
                {language === "en" ? "Insights & News" : language === "ro" ? "Perspective & Noutăți" : "Einblicke & Neuigkeiten"}
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-foreground mb-6">
                {language === "en" ? "Blog" : language === "ro" ? "Blog" : "Blog"}
              </h1>
              <p className="text-xl text-muted-foreground">
                {language === "en" 
                  ? "Expert insights, tips, and stories about professional car repair" 
                  : language === "ro"
                  ? "Perspective de experți, sfaturi și povești despre repararea auto profesională"
                  : "Experten-Einblicke, Tipps und Geschichten über professionelle Autoreparatur"
                }
              </p>
            </motion.div>
          </div>
        </section>

        {/* Featured Post */}
        {featuredPost && (
          <section className="py-12 md:py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Card className="overflow-hidden hover-elevate bg-card border-card-border" data-testid={`card-blog-featured-${featuredPost.slug}`}>
                  <div className="md:flex">
                    <div 
                      className="md:w-1/2 min-h-[300px] bg-cover bg-center bg-no-repeat"
                      style={{ backgroundImage: `url(${histaMercedesBg})` }}
                    />
                    <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
                      <div className="flex flex-wrap items-center gap-4 mb-4">
                        <span className="text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-md">
                          {featuredPost.category}
                        </span>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          {new Date(featuredPost.date).toLocaleDateString(language === "en" ? "en-US" : language === "ro" ? "ro-RO" : "de-DE")}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          {featuredPost.readTime}
                        </div>
                      </div>
                      
                      <h2 className="text-2xl md:text-3xl font-heading font-bold text-card-foreground mb-4">
                        {getTitle(featuredPost)}
                      </h2>
                      
                      <p className="text-muted-foreground mb-6 text-lg">
                        {getDesc(featuredPost)}
                      </p>
                      
                      {'link' in featuredPost && featuredPost.link ? (
                        <Link href={featuredPost.link}>
                          <Button size="lg" className="w-fit gap-2" data-testid="button-read-featured">
                            {language === "en" ? "Read Article" : language === "ro" ? "Citește Articolul" : "Artikel lesen"}
                            <ArrowRight className="w-4 h-4" />
                          </Button>
                        </Link>
                      ) : (
                        <Button size="lg" className="w-fit gap-2" data-testid="button-read-featured">
                          {language === "en" ? "Read Article" : language === "ro" ? "Citește Articolul" : "Artikel lesen"}
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            </div>
          </section>
        )}

        {/* Blog Posts Grid */}
        <section className="py-12 md:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-heading font-bold text-foreground mb-8">
              {language === "en" ? "Latest Articles" : language === "ro" ? "Ultimele Articole" : "Neueste Artikel"}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {regularPosts.map((post, index) => {
                const cardContent = (
                  <Card className="overflow-hidden hover-elevate h-full flex flex-col bg-card border-card-border cursor-pointer" data-testid={`card-blog-${post.slug}`}>
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="flex flex-wrap items-center gap-3 mb-4">
                        <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-md">
                          {post.category}
                        </span>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {post.readTime}
                        </div>
                      </div>
                      
                      <h3 className="text-lg font-heading font-bold text-card-foreground mb-3">
                        {getTitle(post)}
                      </h3>
                      
                      <p className="text-muted-foreground text-sm mb-4 flex-1 line-clamp-3">
                        {getDesc(post)}
                      </p>
                      
                      <div className="flex items-center justify-between pt-4 border-t border-border">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {new Date(post.date).toLocaleDateString(language === "en" ? "en-US" : language === "ro" ? "ro-RO" : "de-DE")}
                        </div>
                        <div className="flex items-center gap-1 text-primary font-medium text-sm">
                          {language === "en" ? "Read" : language === "ro" ? "Citește" : "Lesen"}
                          <ArrowRight className="w-3 h-3" />
                        </div>
                      </div>
                    </div>
                  </Card>
                );

                return (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 * index }}
                  >
                    {'link' in post && post.link ? (
                      <Link href={post.link} className="block h-full">
                        {cardContent}
                      </Link>
                    ) : (
                      cardContent
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Coming Soon Notice */}
            <motion.div
              className="mt-16 pt-16 border-t border-border text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <p className="text-muted-foreground mb-6">
                {language === "en" 
                  ? "More blog posts coming soon. Check back regularly for new insights!" 
                  : language === "ro"
                  ? "Mai multe articole de blog vor apărea în curând. Verifică periodic noi perspective!"
                  : "Weitere Blog-Artikel folgen bald. Besuchen Sie uns regelmäßig für neue Einblicke!"
                }
              </p>
              <Link href="/kontakt">
                <Button variant="outline" data-testid="button-blog-contact">
                  {language === "en" ? "Contact Us" : language === "ro" ? "Contactează-ne" : "Kontaktieren Sie uns"}
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>
      </main>
    </>
  );
}
