# +1 Corion Lackdoktor Website

## Overview
This project delivers a professional, multi-location website for +1 Corion Lackdoktor, a German auto body repair shop. The site aims to showcase services, build trust through testimonials and FAQs, and facilitate client inquiries, ultimately supporting business growth. Key features include over 13 detailed service pages, a filterable photo gallery, customer testimonials, an FAQ, and essential legal pages. The project also integrates an AI-powered system for personalized user interaction and an intelligent chat assistant.

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
- Dark mode enabled by default (pure black background #000000, white text)
- Dark/Light mode toggle available in top-right corner

## System Architecture
The website is a static, client-side React application built with TypeScript and Vite. Wouter manages routing, while Tailwind CSS provides styling, complemented by shadcn/ui components. Form handling uses React Hook Form and Zod for validation. Icons are sourced from Lucide React.

### UI/UX Decisions
- **Color Scheme**: Primary Red (`#C00020`), White (`#FFFFFF`), Black (`#000000`), Light Gray (`#F2F2F2`).
- **Dark Mode**: Full dark mode support with pure black background (`#000000`), white text (`#FFFFFF`), and preserved red brand color. Default theme is dark, with a toggle button.
- **Typography**: Poppins ExtraBold for headings and Open Sans for body text, loaded via Google Fonts.
- **Design Patterns**: Sticky header with dropdown navigation, full-screen hero sections, reusable cards, subtle shadows, and hover/active states.
- **Responsive Design**: Mobile-first approach with Tailwind CSS breakpoints and mobile-specific features like a hamburger menu.

### Technical Implementations
- **Theme System**: `ThemeProvider` context manages dark/light mode with `localStorage` persistence and a `ThemeToggle` button.
- **Page Structure**: Dedicated pages for services, legal information (`/impressum`, `/datenschutz`), gallery, contact, about us, reviews, locations, FAQ, and Academy.
- **Header Navigation**: Sticky header with comprehensive navigation including Home, Leistungen (dropdown), Gutachter, Bewertungen, Academy, FAQ, Kontakt, and Impressum. Logo always links to homepage. Mobile menu features collapsible Leistungen dropdown with scrollable submenu (max-height with overflow-y-auto). Chevron icon rotates on mobile dropdown expansion.
- **Academy Page**: Comprehensive professional training platform featuring 5 specialized courses: Smart Repair Grundlagen (2 days), Lackiertechnik Fortgeschritten (3 days), Dellen- und Drucktechnik/PDR (3 days), Fahrzeugaufbereitung & Finish Excellence (2 days), and Gutachter Ausbildung (5 days certified). Each course includes detailed German descriptions, "Ideal für" targeting, and AI-supported learning. Features PaintMaster GPT section at top with interactive prompt input and quick questions. Emphasizes small groups (max. 6 participants), AI PaintMaster digital companion, waitlist CTA with Early-Bird benefits, and Bildungsprämie funding option. Full responsive design with grid layouts and Framer Motion animations.
- **Impressum Page**: Includes detailed company information, legal disclaimers, clickable contact links, and a prominent AI content disclaimer.
- **Hero Section**: Features "Präzision trifft Innovation – Ihr Lackdoktor für Smart Repair & Gutachten" as the main title, with keywords highlighted in brand red. Updated subtitle emphasizes perfect results through experience, passion, and modern technology. Includes Framer Motion animations, dual CTAs (WhatsApp photo submission and phone call), and trust indicators (20+ years, 4.6/5 rating, 100% guarantee).
- **Conversion Sections**: "Warum +1 Corion Lackdoktor" highlights benefits, "So funktioniert's" outlines a 3-step process, and "Jetzt Angebot einholen" encourages photo submissions for quotes.
- **Floating WhatsApp CTA**: A globally accessible button (`https://wa.me/4917683458274`) with a camera icon, positioned above the AI chat.
- **Google Reviews Integration**: An infinite horizontal slider displays testimonials from `data/reviews.json`, featuring dark mode styling, Framer Motion animation, and SEO-optimized JSON-LD.
- **Enhanced Footer**: Includes "Servicegebiete" for local SEO, with clickable Google Maps links for all locations.
- **Multi-Location Support**: Configuration for three locations (Hofheim-Wallau, Mainz-Kastel, Wiesbaden) with geo-coordinates and integrated Google Maps.
- **SEO Schema**: Updated `LocalBusiness` structured data with accurate geo-coordinates for all locations.
- **Content Management**: Uses German placeholder text, intended for client-provided content.

### SEO Infrastructure
Comprehensive SEO optimization for traditional search engines (Google, Bing) and AI systems (ChatGPT, Gemini, Perplexity, Copilot).

- **`react-helmet-async`**: Installed for dynamic meta tag management in React SPA. `<HelmetProvider>` wraps the App component.
- **`SEO.tsx` Component**: Reusable component managing title, description, keywords, canonical URLs, Open Graph tags, Twitter Card meta, and robots/AI-crawler permissions.
- **Page-Specific Meta Tags**: All main pages include unique, keyword-rich meta tags via `<SEO>` component:
  - Home: "Corion Lackdoktor Hofheim | Smart Repair & Gutachter Wiesbaden"
  - Contact: "Kontakt | Corion Lackdoktor Hofheim"
  - About: "Über Uns | Corion Lackdoktor - 20+ Jahre Erfahrung"
  - FAQ: "FAQ | Häufige Fragen zu Smart Repair & Autoreparatur"
  - Testimonials: "Kundenbewertungen | Corion Lackdoktor - 4.6/5 Sterne"
  - Locations: "Standorte | Corion Lackdoktor - Hofheim, Mainz-Kastel, Wiesbaden"
  - Gutachter: "Gutachterservice | KFZ Schadengutachten Hofheim & Wiesbaden"
  - Gallery: "Galerie | Corion Lackdoktor - Vorher/Nachher Bilder"
  - Impressum: "Impressum | Corion Lackdoktor Hofheim"
- **JSON-LD Schema Markup**:
  - `LocalBusiness` schema on homepage with all 3 locations (Hofheim-Wallau, Mainz-Kastel, Wiesbaden), GPS coordinates, opening hours, and contact details.
  - `FAQPage` schema on FAQ page with all 10 questions for rich search results.
- **AI Optimization Files**:
  - `sitemap.xml`: Complete sitemap with all main URLs (home, services, contact, about, FAQ, gallery, reviews, locations, gutachter, impressum).
  - `llm.txt`: Structured business data for AI systems with services, locations, FAQs, pricing, and contact information.
  - `robots.txt`: Allows GPTBot, Google-Extended, Googlebot, and all crawlers; includes sitemap reference.
- **AI-Briefs**: Hidden Q&A sections (`display: none`, `aria-hidden="true"`) on Homepage and FAQ pages to optimize AI crawler understanding with natural language answers.
- **Canonical URLs**: All pages include canonical URLs pointing to `https://www.corion-lackdoktor.de/`.
- **Social Sharing**: Open Graph and Twitter Card meta tags ensure proper previews when shared on social platforms.

### AI Intelligence System
A dynamic intelligence system learns from user behavior, personalizes interactions, and provides GPT-powered assistance.

- **`appStorage.ts`**: Manages user session with `localStorage` persistence, tracking actions, preferences, chat history, pages visited, and returning user status.
- **`DynamicAIEngine.ts`**: Adaptive intelligence engine analyzing events like page views, scroll depth, clicks, and form interactions to detect user intent (e.g., `seeking_quote`, `ready_to_contact`).
- **`CorionAgent.ts`**: GPT API integration with `AssistantAgent`, `BusinessAgent`, and `LearningAgent` types for varied assistance.
- **`server/routes/ai.ts`**: Backend POST `/api/ai` endpoint integrating OpenAI GPT-4o-mini with customized system prompts.
- **`AIChatWidget.tsx`**: Features a custom-branded chat icon with pulsing animations, positioned below the WhatsApp CTA. Auto-opens for high-intent users, provides suggestion buttons, and persists chat history.
- **`useDynamicIntelligence()` Hook**: Auto-tracks user behavior (page views, scroll depth, idle time) to provide contextual suggestions.
- **Contact Form Integration**: Tracks form interactions, triggering intent changes and recording completion.
- **Key Features**: Session persistence, intent detection, personalized greetings, auto-open logic for the chat widget, comprehensive form tracking, and optional GPT integration with graceful fallback.
- **Data Privacy**: All user data stored locally in browser `localStorage`, with no external tracking services.
- **API Configuration**: Uses GPT-4o-mini with a temperature of 0.7 and max tokens of 500. API key is stored in Replit Secrets (`OPENAI_API_KEY_CORIONLACKDOKTOR`) and not exposed to the frontend.

## External Dependencies
- **Google Fonts**: For typography (Poppins, Open Sans).
- **Google Business Profile**: For direct linking to customer reviews.
- **OpenAI API**: GPT-4o-mini for intelligent chat responses (optional, with fallback).