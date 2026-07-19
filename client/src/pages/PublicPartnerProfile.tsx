import { useMemo, useState } from "react";
import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  MapPin,
  Star,
  Phone,
  MessageCircle,
  Send,
  Camera,
  CheckCircle2,
  Award,
  ShieldCheck,
  Sparkles,
  Mail,
  Clock,
} from "lucide-react";
import SEO from "@/components/SEO";
import {
  getPartnerBySlug,
  type GalleryCategory,
  type GalleryItem,
  type PartnerBadge,
} from "@/data/demoPartnerProfiles";

const CATEGORY_LABEL: Record<GalleryCategory, string> = {
  kratzer: "Kratzer",
  felgen: "Felgen",
  dellen: "Dellen",
  lackierung: "Lackierung",
  aufbereitung: "Aufbereitung",
  oldtimer: "Oldtimer",
};

const BADGE_ICON: Record<PartnerBadge, React.ComponentType<{ className?: string }>> = {
  "Corion Partner": Award,
  Verified: ShieldCheck,
  "Top Rated": Star,
  "Smart Repair Expert": Sparkles,
};

function ScoreBar({ label, value }: { label: string; value: number }) {
  const pct = (value / 5) * 100;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold tabular-nums">{value.toFixed(1)}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full bg-[#E60000]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function PublicPartnerProfile() {
  const params = useParams<{ slug: string }>();
  const [, navigate] = useLocation();
  const profile = useMemo(() => getPartnerBySlug(params.slug ?? ""), [params.slug]);

  const [activeFilter, setActiveFilter] = useState<GalleryCategory | "all">("all");
  const [openImage, setOpenImage] = useState<GalleryItem | null>(null);

  if (!profile) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center max-w-md" data-testid="text-partner-not-found">
          <h1 className="text-2xl font-bold mb-2">Partner nicht gefunden</h1>
          <p className="text-muted-foreground mb-6">
            Diese Partner-Seite existiert leider nicht oder wurde verschoben.
          </p>
          <Button onClick={() => navigate("/standorte")} data-testid="button-back-locations">
            Alle Standorte ansehen
          </Button>
        </div>
      </div>
    );
  }

  const filteredGallery =
    activeFilter === "all"
      ? profile.gallery
      : profile.gallery.filter((g) => g.category === activeFilter);

  const categoriesPresent = Array.from(
    new Set(profile.gallery.map((g) => g.category))
  );

  const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    profile.mapsQuery
  )}`;
  const waLink = `https://wa.me/${profile.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
    `Hallo ${profile.name}, ich möchte ein Foto meines Schadens senden.`
  )}`;
  const contactHref = `/kontakt?partner=${profile.slug}`;

  // Aggregate score per criterion
  const reviewCount = profile.reviews.length || 1;
  const aggScores = profile.reviews.reduce(
    (acc, r) => {
      acc.quality += r.scores.quality;
      acc.punctuality += r.scores.punctuality;
      acc.communication += r.scores.communication;
      acc.price += r.scores.price;
      return acc;
    },
    { quality: 0, punctuality: 0, communication: 0, price: 0 }
  );
  const aggAvg = {
    quality: aggScores.quality / reviewCount,
    punctuality: aggScores.punctuality / reviewCount,
    communication: aggScores.communication / reviewCount,
    price: aggScores.price / reviewCount,
  };

  return (
    <div className="pb-24 md:pb-12">
      <SEO
        title={`${profile.name} – Smart Repair, Felgen & Aufbereitung in ${profile.city}`}
        description={profile.bio}
        canonical={`https://www.corion-lackdoktor.de/partner/${profile.slug}`}
      />

      {/* Cover */}
      <div
        className="relative h-56 md:h-80 w-full bg-cover bg-center"
        style={{ backgroundImage: `url(${profile.cover})` }}
        data-testid="img-partner-cover"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-background" />
      </div>

      <div className="container max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="-mt-16 md:-mt-20 relative">
          <div className="flex flex-col md:flex-row md:items-end gap-4 md:gap-6">
            <Avatar className="h-28 w-28 md:h-32 md:w-32 ring-4 ring-background shadow-xl">
              <AvatarImage src={profile.avatar} alt={profile.name} className="object-cover" />
              <AvatarFallback>{profile.name.slice(0, 2)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 md:pb-2">
              <h1
                className="text-2xl md:text-3xl font-bold leading-tight"
                data-testid="text-partner-name"
              >
                {profile.name}
              </h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" /> {profile.city}, {profile.region}
                </span>
                <span className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-[#E60000] text-[#E60000]" />
                  <span className="font-semibold text-foreground">
                    {profile.rating.toFixed(1)}
                  </span>
                  <span>({profile.reviewsCount} Bewertungen)</span>
                </span>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {profile.badges.map((b) => {
                  const Icon = BADGE_ICON[b];
                  return (
                    <Badge
                      key={b}
                      variant="secondary"
                      className="gap-1"
                      data-testid={`badge-${b.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      <Icon className="w-3 h-3" />
                      {b}
                    </Badge>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 md:gap-4 mt-6">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl md:text-3xl font-bold" data-testid="stat-jobs">
                  {profile.jobsCompleted}+
                </div>
                <div className="text-xs text-muted-foreground mt-1">Lucrări finalizate</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl md:text-3xl font-bold" data-testid="stat-rating">
                  {profile.rating.toFixed(1)}/5
                </div>
                <div className="text-xs text-muted-foreground mt-1">Bewertung</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl md:text-3xl font-bold" data-testid="stat-experience">
                  {profile.yearsExperience}+
                </div>
                <div className="text-xs text-muted-foreground mt-1">Jahre Erfahrung</div>
              </CardContent>
            </Card>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <Button
              size="lg"
              className="bg-[#E60000] text-white font-semibold flex-1"
              onClick={() => navigate(contactHref)}
              data-testid="button-anfrage-senden"
            >
              <Send className="w-4 h-4 mr-2" />
              Anfrage senden
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="flex-1"
              asChild
              data-testid="button-foto-senden"
            >
              <a href={waLink} target="_blank" rel="noopener noreferrer">
                <Camera className="w-4 h-4 mr-2" />
                Foto per WhatsApp senden
              </a>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="sm:w-auto"
              asChild
              data-testid="button-route-anzeigen"
            >
              <a href={mapsLink} target="_blank" rel="noopener noreferrer">
                <MapPin className="w-4 h-4 mr-2" />
                Route anzeigen
              </a>
            </Button>
          </div>

          {/* Bio */}
          <p
            className="mt-6 text-sm md:text-base text-muted-foreground leading-relaxed max-w-3xl"
            data-testid="text-partner-bio"
          >
            {profile.bio}
          </p>

          {/* Specializations */}
          <div className="flex flex-wrap gap-2 mt-4">
            {profile.specializations.map((s) => (
              <Badge key={s} variant="outline" data-testid={`chip-spec-${s}`}>
                {s}
              </Badge>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="arbeiten" className="mt-8">
          <TabsList className="grid grid-cols-4 w-full max-w-2xl">
            <TabsTrigger value="arbeiten" data-testid="tab-arbeiten">
              Arbeiten
            </TabsTrigger>
            <TabsTrigger value="bewertungen" data-testid="tab-bewertungen">
              Bewertungen
            </TabsTrigger>
            <TabsTrigger value="leistungen" data-testid="tab-leistungen">
              Leistungen
            </TabsTrigger>
            <TabsTrigger value="kontakt" data-testid="tab-kontakt">
              Kontakt
            </TabsTrigger>
          </TabsList>

          {/* Arbeiten – Instagram-style grid */}
          <TabsContent value="arbeiten" className="mt-6 space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge
                variant={activeFilter === "all" ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setActiveFilter("all")}
                data-testid="filter-all"
              >
                Alle ({profile.gallery.length})
              </Badge>
              {categoriesPresent.map((c) => (
                <Badge
                  key={c}
                  variant={activeFilter === c ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setActiveFilter(c)}
                  data-testid={`filter-${c}`}
                >
                  {CATEGORY_LABEL[c]}
                </Badge>
              ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5 md:gap-3">
              {filteredGallery.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setOpenImage(item)}
                  className="group relative aspect-square overflow-hidden rounded-md bg-muted"
                  data-testid={`gallery-item-${item.id}`}
                >
                  <img
                    src={item.image}
                    alt={item.title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end p-3 opacity-0 group-hover:opacity-100">
                    <div className="text-white text-xs font-semibold drop-shadow">
                      {item.title}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </TabsContent>

          {/* Bewertungen */}
          <TabsContent value="bewertungen" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <span className="text-3xl font-bold">{profile.rating.toFixed(1)}</span>
                  <span className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${
                          i < Math.round(profile.rating)
                            ? "fill-[#E60000] text-[#E60000]"
                            : "text-muted-foreground"
                        }`}
                      />
                    ))}
                  </span>
                  <span className="text-sm font-normal text-muted-foreground">
                    ({profile.reviewsCount} Bewertungen)
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <ScoreBar label="Qualität" value={aggAvg.quality} />
                  <ScoreBar label="Pünktlichkeit" value={aggAvg.punctuality} />
                  <ScoreBar label="Kommunikation" value={aggAvg.communication} />
                  <ScoreBar label="Preis" value={aggAvg.price} />
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              {profile.reviews.map((r) => (
                <Card key={r.id} data-testid={`review-${r.id}`}>
                  <CardContent className="p-4 md:p-5">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <div className="font-semibold">{r.author}</div>
                        <div className="text-xs text-muted-foreground">{r.date}</div>
                      </div>
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < r.rating
                                ? "fill-[#E60000] text-[#E60000]"
                                : "text-muted-foreground"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{r.content}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Leistungen */}
          <TabsContent value="leistungen" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {profile.services.map((s) => (
                <Card key={s.title} data-testid={`service-${s.title}`}>
                  <CardContent className="p-4 flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#E60000] mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold">{s.title}</h3>
                        {s.price && (
                          <Badge className="bg-[#E60000] text-white shrink-0">
                            {s.price}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {s.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Kontakt */}
          <TabsContent value="kontakt" className="mt-6 space-y-3">
            <Card>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-[#E60000] mt-0.5 shrink-0" />
                  <div>
                    <div className="font-semibold">Adresse</div>
                    <div className="text-sm text-muted-foreground">
                      {profile.address}
                    </div>
                    <a
                      href={mapsLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-[#E60000] hover:underline mt-1 inline-block"
                      data-testid="link-route"
                    >
                      Route in Google Maps öffnen →
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-[#E60000] mt-0.5 shrink-0" />
                  <div>
                    <div className="font-semibold">Telefon</div>
                    <a
                      href={`tel:${profile.phone.replace(/\s/g, "")}`}
                      className="text-sm text-muted-foreground hover:underline"
                      data-testid="link-phone"
                    >
                      {profile.phone}
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MessageCircle className="w-5 h-5 text-[#E60000] mt-0.5 shrink-0" />
                  <div>
                    <div className="font-semibold">WhatsApp</div>
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-muted-foreground hover:underline"
                      data-testid="link-whatsapp"
                    >
                      Foto per WhatsApp senden
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-[#E60000] mt-0.5 shrink-0" />
                  <div>
                    <div className="font-semibold">E-Mail</div>
                    <a
                      href={`mailto:${profile.email}`}
                      className="text-sm text-muted-foreground hover:underline"
                      data-testid="link-email"
                    >
                      {profile.email}
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-[#E60000] mt-0.5 shrink-0" />
                  <div>
                    <div className="font-semibold">Öffnungszeiten</div>
                    <div className="text-sm text-muted-foreground">
                      Mo–Fr: 8:00 – 18:00 · Sa: nach Vereinbarung
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <iframe
              title={`Karte ${profile.name}`}
              src={`https://www.google.com/maps?q=${encodeURIComponent(
                profile.mapsQuery
              )}&output=embed`}
              className="w-full h-64 md:h-80 rounded-md border border-border"
              loading="lazy"
              data-testid="iframe-map"
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Mobile sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-background/95 backdrop-blur border-t border-border p-3 flex gap-2">
        <Button
          className="flex-1 bg-[#E60000] text-white font-semibold"
          onClick={() => navigate(contactHref)}
          data-testid="button-mobile-anfrage"
        >
          <Send className="w-4 h-4 mr-2" />
          Anfrage senden
        </Button>
        <Button variant="outline" size="icon" asChild data-testid="button-mobile-wa">
          <a href={waLink} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
            <Camera className="w-4 h-4" />
          </a>
        </Button>
      </div>

      {/* Image lightbox */}
      <Dialog open={!!openImage} onOpenChange={(o) => !o && setOpenImage(null)}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden">
          <DialogTitle className="sr-only">{openImage?.title}</DialogTitle>
          {openImage && (
            <div>
              <img
                src={openImage.image}
                alt={openImage.title}
                className="w-full h-auto max-h-[70vh] object-contain bg-black"
              />
              <div className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold">{openImage.title}</h3>
                  <Badge variant="outline">{CATEGORY_LABEL[openImage.category]}</Badge>
                </div>
                {openImage.description && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {openImage.description}
                  </p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
