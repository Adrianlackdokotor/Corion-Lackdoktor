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
- **Google Reviews Integration**: Displays customer testimonials from `data/reviews.json`, including average rating and total review count. SEO-optimized with JSON-LD structured data for rich snippets. Future enhancement includes potential Google Places API integration for automated review fetching.
- **Multi-Location Support**: Configuration for three distinct locations: Wiesbaden, Hofheim-Wallau, and Mainz-Kastel.
- **Content Management**: All pages use German placeholder text, expecting the client to replace it with actual content and workshop images.

## External Dependencies
- **Google Fonts**: Used for Montserrat and Open Sans typography.
- **Google Business Profile**: Direct linking for customer reviews.
- **Google Maps API**: (Future enhancement for automatic review fetching via Google Places API, not currently integrated).