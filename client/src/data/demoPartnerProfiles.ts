import felgenA from "@assets/felgenreparatur-vorher-nachher-corion-lackdoktor-hofheim_1761382190237.png";
import felgenB from "@assets/felgenreparatur-vorher-nachher-corion-lackdoktor-hofheim_1761382288902.png";
import doorBA from "@assets/Car_door_damage_vs_repair_comparation_1777038620889.png";
import workshopFocus from "@assets/Focused_repair_in_the_workshop_1777038689994.png";
import wheelBA from "@assets/generated_images/Wheel_rim_before-after_repair_comparison_d3529f25.png";
import polishingBA from "@assets/generated_images/before_and_after_polishing_results.png";
import autoDetailing from "@assets/generated_images/Auto_detailing_service_image_222c746b.png";
import wheelService from "@assets/generated_images/Wheel_repair_service_image_878b7e9d.png";
import paintService from "@assets/generated_images/Paint_service_image_68d4cdbf.png";
import classicCar from "@assets/generated_images/Classic_car_restoration_image_360d4f59.png";
import workshopHero from "@assets/generated_images/Professional_workshop_hero_image_5d91be84.png";
import polishedCar from "@assets/generated_images/gleaming_polished_car_result.png";
import polishingMachine from "@assets/generated_images/professional_polishing_machine_in_action.png";
import polishingTechnique from "@assets/generated_images/professional_polishing_technique.png";
import detailingSetup from "@assets/generated_images/professional_detailing_workshop_setup.png";
import dentRemoval from "@assets/generated_images/Dent_removal_service_image_b9ce6b23.png";

export type GalleryCategory =
  | "kratzer"
  | "felgen"
  | "dellen"
  | "lackierung"
  | "aufbereitung"
  | "oldtimer";

export type GalleryItem = {
  id: string;
  image: string;
  beforeImage?: string;
  category: GalleryCategory;
  title: string;
  description?: string;
};

export type PublicReview = {
  id: string;
  author: string;
  rating: number;
  date: string;
  content: string;
  scores: {
    quality: number;
    punctuality: number;
    communication: number;
    price: number;
  };
};

export type PartnerBadge =
  | "Corion Partner"
  | "Verified"
  | "Top Rated"
  | "Smart Repair Expert";

export type PartnerService = {
  title: string;
  description: string;
  price?: string;
};

export type PartnerProfile = {
  slug: string;
  name: string;
  city: string;
  region: string;
  address: string;
  phone: string;
  whatsapp: string;
  email: string;
  mapsQuery: string;
  cover: string;
  avatar: string;
  rating: number;
  reviewsCount: number;
  jobsCompleted: number;
  yearsExperience: number;
  bio: string;
  specializations: string[];
  badges: PartnerBadge[];
  services: PartnerService[];
  gallery: GalleryItem[];
  reviews: PublicReview[];
};

const FIVE_STAR = { quality: 5, punctuality: 5, communication: 5, price: 5 };

export const demoPartnerProfiles: PartnerProfile[] = [
  {
    slug: "hofheim",
    name: "+1 Corion Lackdoktor Hofheim",
    city: "Hofheim am Taunus",
    region: "Rhein-Main",
    address: "Lorsbacher Str. 21, 65719 Hofheim",
    phone: "+49 176 8345 8274",
    whatsapp: "+4917683458274",
    email: "coriongmbh@gmail.com",
    mapsQuery: "Lorsbacher Str. 21, 65719 Hofheim",
    cover: workshopHero,
    avatar: workshopFocus,
    rating: 4.9,
    reviewsCount: 184,
    jobsCompleted: 642,
    yearsExperience: 20,
    bio: "Smart Repair, Felgenreparatur und professionelle Fahrzeugaufbereitung im Herzen des Taunus. Über 20 Jahre Erfahrung, schnelle Termine und transparente Festpreise.",
    specializations: ["Smart Repair", "Felgen", "Lackschäden", "Aufbereitung"],
    badges: ["Corion Partner", "Verified", "Top Rated", "Smart Repair Expert"],
    services: [
      { title: "Kratzer & Lackschäden", description: "Spot-Repair statt Neulackierung", price: "ab 150 €" },
      { title: "Felgenreparatur", description: "Bordsteinschäden, Lackschäden", price: "ab 120 €" },
      { title: "Dellen ohne Lackierung", description: "Smart-Repair-Verfahren" },
      { title: "Fahrzeugaufbereitung", description: "Innen & Außen, Politur, Versiegelung", price: "ab 99 €" },
      { title: "Leasingrückläufer", description: "Komplettcheck & Aufbereitung vor Rückgabe" },
    ],
    gallery: [
      { id: "h1", image: felgenA, category: "felgen", title: "Felgenreparatur Vorher/Nachher" },
      { id: "h2", image: doorBA, category: "kratzer", title: "Türschaden – Smart Repair" },
      { id: "h3", image: wheelBA, category: "felgen", title: "Alufelge Glanzgedreht" },
      { id: "h4", image: polishingBA, category: "aufbereitung", title: "Politur & Versiegelung" },
      { id: "h5", image: workshopFocus, category: "lackierung", title: "Spot-Repair in der Werkstatt" },
      { id: "h6", image: felgenB, category: "felgen", title: "Felgenrand restauriert" },
    ],
    reviews: [
      {
        id: "h-r1",
        author: "Markus W.",
        rating: 5,
        date: "März 2026",
        content:
          "Top Werkstatt! Felge war wie neu nach 2 Stunden. Faire Preise, sehr freundlich.",
        scores: FIVE_STAR,
      },
      {
        id: "h-r2",
        author: "Sabine R.",
        rating: 5,
        date: "Februar 2026",
        content:
          "Foto per WhatsApp geschickt, gleich Angebot bekommen. Termin am nächsten Tag. Klare Empfehlung!",
        scores: { quality: 5, punctuality: 5, communication: 5, price: 4 },
      },
      {
        id: "h-r3",
        author: "Tarek B.",
        rating: 5,
        date: "Januar 2026",
        content: "Kratzer am Kotflügel, kein Unterschied mehr sichtbar. Super Arbeit!",
        scores: FIVE_STAR,
      },
    ],
  },
  {
    slug: "frankfurt",
    name: "+1 Corion Lackdoktor Frankfurt",
    city: "Frankfurt am Main",
    region: "Hessen",
    address: "Mainzer Landstraße 178, 60327 Frankfurt am Main",
    phone: "+49 176 8345 8274",
    whatsapp: "+4917683458274",
    email: "coriongmbh@gmail.com",
    mapsQuery: "Mainzer Landstraße 178, 60327 Frankfurt am Main",
    cover: paintService,
    avatar: workshopHero,
    rating: 4.8,
    reviewsCount: 142,
    jobsCompleted: 478,
    yearsExperience: 15,
    bio: "Lackdoktor mitten in Frankfurt. Spot-Repair, Felgen und schnelle Aufbereitung – auch Express-Termine für Geschäftskunden und Leasingrückläufer.",
    specializations: ["Smart Repair", "Lackierung", "Aufbereitung", "Leasing"],
    badges: ["Corion Partner", "Verified", "Top Rated"],
    services: [
      { title: "Spot-Repair Lackschäden", description: "Kratzer, Steinschläge, Parkrempler", price: "ab 150 €" },
      { title: "Felgenreparatur", description: "Stahl & Alu, Glanzdrehen möglich", price: "ab 120 €" },
      { title: "Aufbereitung Premium", description: "Mehrstufige Politur & Versiegelung", price: "ab 199 €" },
      { title: "Leasingrückläufer-Check", description: "Schadensbewertung & Aufbereitung vor Rückgabe" },
    ],
    gallery: [
      { id: "f1", image: paintService, category: "lackierung", title: "Komplettlackierung" },
      { id: "f2", image: doorBA, category: "kratzer", title: "Türgriff-Bereich" },
      { id: "f3", image: polishedCar, category: "aufbereitung", title: "Premium Politur" },
      { id: "f4", image: wheelService, category: "felgen", title: "Felgen-Service" },
      { id: "f5", image: polishingMachine, category: "aufbereitung", title: "Politur in Aktion" },
      { id: "f6", image: detailingSetup, category: "aufbereitung", title: "Aufbereitung Innenraum" },
    ],
    reviews: [
      {
        id: "f-r1",
        author: "Daniel K.",
        rating: 5,
        date: "März 2026",
        content:
          "Schnell, sauber, kompetent. Auto sah nach der Aufbereitung aus wie neu. Gerne wieder.",
        scores: FIVE_STAR,
      },
      {
        id: "f-r2",
        author: "Lena S.",
        rating: 4,
        date: "Februar 2026",
        content:
          "Sehr gute Arbeit am Stoßfänger. Etwas Wartezeit, aber Ergebnis stimmt.",
        scores: { quality: 5, punctuality: 4, communication: 5, price: 4 },
      },
    ],
  },
  {
    slug: "wiesbaden",
    name: "+1 Corion Lackdoktor Wiesbaden",
    city: "Wiesbaden",
    region: "Hessen",
    address: "Mainzer Str. 75, 65189 Wiesbaden",
    phone: "+49 176 8345 8274",
    whatsapp: "+4917683458274",
    email: "coriongmbh@gmail.com",
    mapsQuery: "Mainzer Str. 75, 65189 Wiesbaden",
    cover: classicCar,
    avatar: detailingSetup,
    rating: 4.9,
    reviewsCount: 96,
    jobsCompleted: 312,
    yearsExperience: 12,
    bio: "Spezialisiert auf Oldtimer, Premium-Aufbereitung und feinste Lackarbeiten. Ihr Fahrzeug ist bei uns in Meisterhand.",
    specializations: ["Oldtimer", "Premium-Lackierung", "Aufbereitung"],
    badges: ["Corion Partner", "Verified", "Top Rated"],
    services: [
      { title: "Oldtimer-Restauration", description: "Sensible Lackarbeiten, originalgetreu" },
      { title: "Premium-Politur", description: "3-Stufen-Politur mit Keramikversiegelung", price: "ab 249 €" },
      { title: "Smart Repair", description: "Kleinschäden ohne Neulackierung", price: "ab 150 €" },
      { title: "Felgenreparatur", description: "Auch Diamond-Cut Felgen", price: "ab 130 €" },
    ],
    gallery: [
      { id: "w1", image: classicCar, category: "oldtimer", title: "Oldtimer Restauration" },
      { id: "w2", image: polishedCar, category: "aufbereitung", title: "Keramikversiegelung" },
      { id: "w3", image: polishingTechnique, category: "aufbereitung", title: "Hand-Politur" },
      { id: "w4", image: paintService, category: "lackierung", title: "Lackaufbau" },
      { id: "w5", image: wheelBA, category: "felgen", title: "Felge restauriert" },
      { id: "w6", image: autoDetailing, category: "aufbereitung", title: "Innenraum-Aufbereitung" },
    ],
    reviews: [
      {
        id: "w-r1",
        author: "Hans-Peter M.",
        rating: 5,
        date: "März 2026",
        content:
          "Mein 1972er Mercedes wurde liebevoll und professionell behandelt. Beste Adresse für Klassiker.",
        scores: FIVE_STAR,
      },
      {
        id: "w-r2",
        author: "Carmen V.",
        rating: 5,
        date: "Februar 2026",
        content: "Politur ist ein Traum. Lack glänzt wie nie. Sehr zu empfehlen!",
        scores: FIVE_STAR,
      },
    ],
  },
  {
    slug: "mainz",
    name: "+1 Corion Lackdoktor Mainz",
    city: "Mainz",
    region: "Rheinland-Pfalz",
    address: "Rheinstraße 105, 55116 Mainz",
    phone: "+49 176 8345 8274",
    whatsapp: "+4917683458274",
    email: "coriongmbh@gmail.com",
    mapsQuery: "Rheinstraße 105, 55116 Mainz",
    cover: wheelService,
    avatar: polishingMachine,
    rating: 4.7,
    reviewsCount: 78,
    jobsCompleted: 246,
    yearsExperience: 8,
    bio: "Kompetenz für Felgen und Smart Repair direkt am Rhein. Express-Termine an Werktagen, Annahme auch samstags nach Vereinbarung.",
    specializations: ["Felgen", "Smart Repair", "Dellen"],
    badges: ["Corion Partner", "Verified", "Smart Repair Expert"],
    services: [
      { title: "Felgenreparatur", description: "Bordsteinschäden, Komplettlackierung", price: "ab 120 €" },
      { title: "Dellen ohne Lackierung", description: "PDR – Paintless Dent Repair" },
      { title: "Smart Repair", description: "Kratzer, Steinschläge", price: "ab 150 €" },
      { title: "Aufbereitung Basic", description: "Wäsche, Politur, Innenreinigung", price: "ab 99 €" },
    ],
    gallery: [
      { id: "m1", image: wheelService, category: "felgen", title: "Felgen-Service" },
      { id: "m2", image: dentRemoval, category: "dellen", title: "Dellenentfernung" },
      { id: "m3", image: felgenA, category: "felgen", title: "Felge Vorher/Nachher" },
      { id: "m4", image: doorBA, category: "kratzer", title: "Tür-Kratzer entfernt" },
      { id: "m5", image: polishingTechnique, category: "aufbereitung", title: "Hand-Politur" },
      { id: "m6", image: felgenB, category: "felgen", title: "Felgen-Restaurierung" },
    ],
    reviews: [
      {
        id: "m-r1",
        author: "Jasmin O.",
        rating: 5,
        date: "März 2026",
        content: "Felge in 2h fertig, sieht aus wie neu. Super Preis-Leistung.",
        scores: FIVE_STAR,
      },
      {
        id: "m-r2",
        author: "Kemal D.",
        rating: 4,
        date: "Januar 2026",
        content: "Delle perfekt entfernt ohne Lackierung. Sehr gerne wieder.",
        scores: { quality: 5, punctuality: 4, communication: 4, price: 5 },
      },
    ],
  },
  {
    slug: "wallau",
    name: "+1 Corion Lackdoktor Wallau",
    city: "Hofheim-Wallau",
    region: "Rhein-Main",
    address: "Industriestraße 8, 65719 Hofheim-Wallau",
    phone: "+49 176 8345 8274",
    whatsapp: "+4917683458274",
    email: "coriongmbh@gmail.com",
    mapsQuery: "Industriestraße 8, 65719 Hofheim-Wallau",
    cover: detailingSetup,
    avatar: polishingTechnique,
    rating: 4.8,
    reviewsCount: 64,
    jobsCompleted: 198,
    yearsExperience: 6,
    bio: "Aufbereitungs-Spezialist mit modernster Ausstattung. Schwerpunkt Premium-Politur, Keramikbeschichtung und Geruchsneutralisation.",
    specializations: ["Aufbereitung", "Politur", "Versiegelung"],
    badges: ["Corion Partner", "Verified"],
    services: [
      { title: "Aufbereitung Premium", description: "Außen & Innen komplett", price: "ab 249 €" },
      { title: "Keramikversiegelung", description: "Bis zu 5 Jahre Schutz", price: "ab 599 €" },
      { title: "Geruchsneutralisation", description: "Ozon-Behandlung" },
      { title: "Smart Repair", description: "Kleine Kratzer & Lackdefekte", price: "ab 150 €" },
    ],
    gallery: [
      { id: "wa1", image: detailingSetup, category: "aufbereitung", title: "Aufbereitung-Bay" },
      { id: "wa2", image: polishedCar, category: "aufbereitung", title: "Endergebnis Premium" },
      { id: "wa3", image: polishingMachine, category: "aufbereitung", title: "Maschinen-Politur" },
      { id: "wa4", image: polishingBA, category: "aufbereitung", title: "Vorher/Nachher Politur" },
      { id: "wa5", image: autoDetailing, category: "aufbereitung", title: "Detail-Arbeit" },
      { id: "wa6", image: doorBA, category: "kratzer", title: "Smart Repair Tür" },
    ],
    reviews: [
      {
        id: "wa-r1",
        author: "Stefan H.",
        rating: 5,
        date: "März 2026",
        content: "Keramikversiegelung perfekt aufgebracht. Wasser perlt seit Wochen ab.",
        scores: FIVE_STAR,
      },
      {
        id: "wa-r2",
        author: "Anna L.",
        rating: 5,
        date: "Februar 2026",
        content: "Auto roch nach Hund – jetzt wie neu. Riesen Dankeschön!",
        scores: FIVE_STAR,
      },
    ],
  },
];

export function getPartnerBySlug(slug: string): PartnerProfile | undefined {
  return demoPartnerProfiles.find((p) => p.slug === slug);
}

export const RESERVED_PARTNER_SLUGS = [
  "dashboard",
  "onboarding",
  "workshop-orders",
];
