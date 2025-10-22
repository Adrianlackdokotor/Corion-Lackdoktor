# +1 Corion Lackdoktor Website

## Overview
This project delivers a professional website for +1 Corion Lackdoktor, a German auto body repair shop. The site is designed to showcase their services across multiple locations (Wiesbaden, Hofheim-Wallau, Mainz-Kastel) and includes over 13 detailed service pages, a photo gallery with filters, customer testimonials, an FAQ, and essential legal pages. The primary goal is to provide a comprehensive online presence, highlight trust indicators, and facilitate client inquiries, ultimately supporting business growth and market potential in the region.

## User Preferences
- User prefers architecture-first, content later
- Will handle IONOS deployment independently
- Wants German content placeholders
- Focused on professional, clean design
- Montserrat for modern, professional headings
- Open Sans for readable body text
- Red (`#C00020`) as primary to match brand
- Multi-location support emphasized
- Trust indicators prominently displayed

## System Architecture
The website is built as a static, client-side only application using **React** with **TypeScript** and **Vite**. **Wouter** handles routing, while **Tailwind CSS** provides utility-first styling, complemented by **shadcn/ui** components for enhanced UI elements. Form handling is managed with **React Hook Form** and **Zod** for validation. Icons are sourced from **Lucide React**.

### UI/UX Decisions
- **Color Scheme**: Primary Red (`#C00020`), White (`#FFFFFF`), Black (`#000000`), Light Gray (`#F2F2F2`) to match brand identity.
- **Typography**: Montserrat for headings (`font-heading`) and Open Sans for body text (`font-sans`), loaded via Google Fonts.
- **Design Patterns**: Sticky header with dropdown navigation, full-screen hero sections with CTAs, reusable cards for services, testimonials, and locations, subtle shadows and borders, and hover/active states for interactive elements.
- **Responsive Design**: Mobile-first approach with Tailwind CSS breakpoints (`sm`, `md`, `lg`, `xl`) and mobile-specific features like a hamburger menu and collapsible submenus.

### Technical Implementations
- **Page Structure**: Dedicated pages for 13+ services (e.g., `/leistungen/unfallschaeden`), legal information (`/impressum`, `/datenschutz`), `galerie` with filtering, `kontakt`, `uber-uns`, `bewertungen`, `standorte`, and `faq`.
- **Hero Section (Updated October 2025)**: 
  - **Honest Messaging**: Removed all "Meisterbetrieb" terminology and replaced with "Team in Ausbildung zum Meister" throughout site
  - **SEO-Optimized H1**: "Professionelle Autoreparatur in Wiesbaden, Hofheim & Mainz-Kastel" for local search visibility
  - **Rotating Text Animation**: Framer Motion AnimatePresence rotates through 3 core services every 2.5s: "Unfallschäden", "Lackschäden", "Smart Repair"
  - **Emotional Subtitle**: "Ihr Auto in besten Händen – schnell, fair und mit Leidenschaft lackiert"
  - **Trust Indicators**: Display 20+ years experience, 4.6/5 rating (642 reviews), 100% guarantee
  - **Dual CTAs**: "Kostenvoranschlag erhalten" (primary) and "Jetzt Anrufen" (outline with backdrop blur)
- **"Warum +1 Corion Lackdoktor" Section**: 4 benefit cards with Lucide icons (Award, Clock, Shield, Users), hover elevation effects, highlighting key differentiators
- **"So funktioniert's" Section**: 3-step conversion process with numbered cards (1: Foto senden, 2: Angebot erhalten, 3: Reparatur durchführen), Camera/FileCheck/Wrench icons
- **Floating WhatsApp CTA**: Globally accessible green button (bottom-right, fixed position, z-50) with scale/opacity animations, links to `https://wa.me/4917683458274`
- **"Jetzt Angebot einholen" Section**: Conversion-optimized section on homepage encouraging users to send photos of damage for free quotes. Features animated smartphone image, 3 CTA buttons (WhatsApp, Contact Form, Email), and Camera icon. All fixed pricing removed from service pages and replaced with "Preis individuell – senden Sie uns ein Foto für ein kostenloses Angebot."
- **Google Reviews Integration**: Dark mode infinite horizontal slider displaying customer testimonials from `data/reviews.json`. Features black background, white text, red accents (#C00020), and gold stars (#FFD700). Smooth Framer Motion animation moves cards continuously right-to-left with seamless loop. Responsive design shows 1-4 cards depending on viewport. Includes average rating (4.6/5) and total review count (642). SEO-optimized with JSON-LD structured data for rich snippets and theme-color meta tag.
- **Enhanced Footer**: Added "Servicegebiete: Hofheim · Wiesbaden · Mainz-Kastel · Frankfurt Umgebung" for local SEO
- **Multi-Location Support**: Configuration for three distinct locations with geo-coordinates:
  - Hofheim-Wallau: 50.0780°N, 8.4450°E
  - Mainz-Kastel: 50.0037°N, 8.3031°E
  - Wiesbaden: 50.0826°N, 8.2400°E
- **SEO Schema**: Updated LocalBusiness structured data with accurate geo-coordinates for all 3 locations, multiple addresses, and honest description
- **Content Management**: All pages use German placeholder text, expecting the client to replace it with actual content and workshop images.

## External Dependencies
- **Google Fonts**: Used for Montserrat and Open Sans typography.
- **Google Business Profile**: Direct linking for customer reviews.
- **Google Maps API**: (Future enhancement for automatic review fetching via Google Places API, not currently integrated).