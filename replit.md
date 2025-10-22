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
- **Dark mode enabled by default** (pure black background #000000, white text)
- Dark/Light mode toggle available in top-right corner

## System Architecture
The website is built as a static, client-side only application using **React** with **TypeScript** and **Vite**. **Wouter** handles routing, while **Tailwind CSS** provides utility-first styling, complemented by **shadcn/ui** components for enhanced UI elements. Form handling is managed with **React Hook Form** and **Zod** for validation. Icons are sourced from **Lucide React**.

### UI/UX Decisions
- **Color Scheme**: Primary Red (`#C00020`), White (`#FFFFFF`), Black (`#000000`), Light Gray (`#F2F2F2`) to match brand identity.
- **Dark Mode**: Full dark mode support with pure black background (`#000000`), white text (`#FFFFFF`), and maintained red brand color. Default theme is dark, with toggle button in top-right corner.
- **Typography**: Montserrat for headings (`font-heading`) and Open Sans for body text (`font-sans`), loaded via Google Fonts.
- **Design Patterns**: Sticky header with dropdown navigation, full-screen hero sections with CTAs, reusable cards for services, testimonials, and locations, subtle shadows and borders, and hover/active states for interactive elements.
- **Responsive Design**: Mobile-first approach with Tailwind CSS breakpoints (`sm`, `md`, `lg`, `xl`) and mobile-specific features like a hamburger menu and collapsible submenus.

### Technical Implementations
- **Theme System**: ThemeProvider context manages dark/light mode with localStorage persistence. ThemeToggle button (top-right, z-50) switches themes. Dark mode uses pure black background for maximum contrast.
- **Page Structure**: Dedicated pages for 13+ services (e.g., `/leistungen/unfallschaeden`), legal information (`/impressum`, `/datenschutz`), `galerie` with filtering, `kontakt`, `uber-uns`, `bewertungen`, `standorte`, and `faq`.
- **Impressum Page (Updated October 2025)**:
  - **Company Information**: Corion GmbH, Nassaustraße 41, 65719 Hofheim am Taunus
  - **Legal Details**: Managing Director Adrian Apostol, Commercial Register HRB 128302 (Amtsgericht Frankfurt am Main)
  - **Clickable Contact Links**: Phone (+49 176 83458274) and Email (coriongmbh@gmail.com) with tel: and mailto: protocols
  - **AGB Section**: Complete terms and conditions including AI content disclaimer
  - **Prominent AI Disclaimer**: Bordered section warning about KI-gestützte Assistenten (AI-powered assistants) with recommendations to verify AI-generated information before making decisions
  - **Legal Compliance**: EU dispute resolution, consumer arbitration, content responsibility per §55 Abs. 2 RStV, TMG disclaimers
  - **Dark Mode Compatible**: All sections properly styled with readable text on dark background
- **Hero Section (Updated October 2025)**: 
  - **Honest Messaging**: Removed all "Meisterbetrieb" terminology and replaced with "Team in Ausbildung zum Meister" throughout site
  - **SEO-Optimized H1**: "Professionelle Autoreparatur in Wiesbaden, Hofheim & Mainz-Kastel" for local search visibility
  - **Rotating Text Animation**: Framer Motion AnimatePresence rotates through 3 core services every 2.5s: "Unfallschäden", "Lackschäden", "Smart Repair"
  - **Emotional Subtitle**: "Ihr Auto in besten Händen – schnell, fair und mit Leidenschaft lackiert"
  - **Trust Indicators**: Display 20+ years experience, 4.6/5 rating (642 reviews), 100% guarantee
  - **Dual CTAs**: "Kostenvoranschlag erhalten" (primary) and "Jetzt Anrufen" (outline with backdrop blur)
- **"Warum +1 Corion Lackdoktor" Section**: 4 benefit cards with Lucide icons (Award, Clock, Shield, Users), hover elevation effects, highlighting key differentiators
- **"So funktioniert's" Section**: 3-step conversion process with numbered cards (1: Foto senden, 2: Angebot erhalten, 3: Reparatur durchführen), Camera/FileCheck/Wrench icons
- **Floating WhatsApp CTA**: Globally accessible red button with Camera icon (fixed position: bottom-24 right-24, z-40) with scale/opacity animations, text "Foto schicken für Angebot", links to `https://wa.me/4917683458274`. Positioned above the AI chat button.
- **"Jetzt Angebot einholen" Section**: Conversion-optimized section on homepage encouraging users to send photos of damage for free quotes. Features animated smartphone image, 3 CTA buttons (WhatsApp, Contact Form, Email), and Camera icon. All fixed pricing removed from service pages and replaced with "Preis individuell – senden Sie uns ein Foto für ein kostenloses Angebot."
- **Google Reviews Integration**: Dark mode infinite horizontal slider displaying customer testimonials from `data/reviews.json`. Features black background, white text, red accents (#C00020), and gold stars (#FFD700). Smooth Framer Motion animation moves cards continuously right-to-left with seamless loop. Responsive design shows 1-4 cards depending on viewport. Includes average rating (4.6/5) and total review count (642). SEO-optimized with JSON-LD structured data for rich snippets and theme-color meta tag.
- **Enhanced Footer**: Added "Servicegebiete: Hofheim · Wiesbaden · Mainz-Kastel · Frankfurt Umgebung" for local SEO. All location addresses are clickable Google Maps links that open in new tabs using GPS coordinates for precise navigation.
- **Multi-Location Support**: Configuration for three distinct locations with geo-coordinates:
  - Hofheim-Wallau: Nassau Str. 41, 65719 Hofheim-Wallau (50.0780°N, 8.4450°E) - Google Maps integrated
  - Mainz-Kastel: Wiesbadener Str. 30, 55252 Mainz-Kastel (50.0037°N, 8.3031°E) - Google Maps integrated
  - Wiesbaden: Standort Wiesbaden, 65xxx Wiesbaden (50.0826°N, 8.2400°E)
- **SEO Schema**: Updated LocalBusiness structured data with accurate geo-coordinates for all 3 locations, multiple addresses, and honest description
- **Content Management**: All pages use German placeholder text, expecting the client to replace it with actual content and workshop images.

## AI Intelligence System (Implemented October 2025)
A comprehensive dynamic intelligence system that learns from user behavior, personalizes interactions, and provides GPT-powered assistance.

### Architecture Components

**1. appStorage.ts (client/src/lib/appStorage.ts)**
- User session management with localStorage persistence
- Tracks: actions, preferences, chat history, pages visited, time on site, returning user status
- Functions: saveUserSession, getUserSession, updateUserAction, addChatMessage, trackPageVisit, markReturningUser

**2. DynamicAIEngine.ts (client/src/lib/DynamicAIEngine.ts)**
- Adaptive intelligence engine for behavior analysis
- Tracks events: page views, scroll depth, clicks, form interactions, idle time
- Intent detection: browsing, seeking_quote, returning_customer, interested_service, ready_to_contact
- Contextual suggestions and personalized greeting generation

**3. CorionAgent.ts (client/src/agents/CorionAgent.ts)**
- GPT API integration layer with 3 specialized agent types:
  - **AssistantAgent**: Customer support and general questions
  - **BusinessAgent**: Quote generation, service suggestions, timeframe estimates
  - **LearningAgent**: Behavior analysis and improvement recommendations
- Fallback responses when OpenAI API key not configured

**4. server/routes/ai.ts**
- Backend POST /api/ai endpoint
- OpenAI GPT-4o-mini integration
- System prompts customized per agent type
- Returns intelligent responses or fallback messages

**5. AIChatWidget.tsx (client/src/components/AIChatWidget.tsx)**
- **Custom Branding**: Uses uploaded image (`chat-icon_1761147332590.png`) as chat icon - woman half-human, half-digital with headset
- **Pulsing Animation**: Two Framer Motion rings pulse continuously around icon for attention-grabbing effect
  - First ring: scales 1→1.3, opacity 0.4→0, 2s duration
  - Second ring: scales 1→1.2, opacity 0.5→0, 2s duration with 0.5s delay
- Floating chat button positioned below WhatsApp CTA (z-index: 40)
- Full chat window with message history and spring animations
- Auto-opens for returning users with high intent (2+ pages or 60+ seconds)
- Suggestion buttons based on detected user intent
- Persistent chat history via localStorage
- Enhanced border effects (primary red with opacity, hover transitions)

**6. useDynamicIntelligence() Hook (client/src/hooks/useDynamicIntelligence.ts)**
- Auto-tracks: page views, scroll depth (every 25%), idle time (30s threshold)
- Provides: triggerAIAction, trackClick, trackFormStart, trackFormComplete
- Intent detection and contextual suggestions

**7. Contact Form Integration**
- Contact form fully integrated with AI tracking
- Tracks form start (first field focus) → triggers "seeking_quote" intent
- Tracks form completion → records "ready_to_contact" intent
- Records whether photos were uploaded

### Key Features
- **Session Persistence**: All user data stored in localStorage with proper returning user detection
- **Intent Detection**: 5 intent types analyzed from behavior patterns
- **Personalized Greetings**: Context-aware welcome messages based on user history
- **Auto-Open Logic**: Chat widget automatically opens for returning users with engagement signals
- **Form Tracking**: Complete tracking of contact form interactions for conversion optimization
- **GPT Integration**: Optional OpenAI API key for intelligent responses (graceful fallback if missing)

### Data Privacy
- All data stored locally in browser localStorage (plain JSON)
- No external tracking services
- User data never leaves the browser except for GPT API calls (when configured)
- Session data includes: user ID, actions, preferences, chat history, pages visited, time on site

### Testing Status
- End-to-end tested with Playwright (October 2025)
- Verified: form tracking, intent detection, session persistence, returning user detection, AI chat functionality
- All core tracking features working as expected
- OpenAI API integration verified with GPT-4o-mini (October 2025)
- API key: `OPENAI_API_KEY_CORIONLACKDOKTOR` configured in Replit Secrets

### Future Roadmap (Prepared Infrastructure)

The AI system is architected to support future enhancements:

**1. GPT Vision API Integration**
- **Purpose**: Automatic damage analysis from uploaded photos
- **Use Case**: User uploads car damage photos → GPT Vision analyzes → generates preliminary cost estimate
- **Implementation Ready**: Photo upload already integrated in contact form
- **Next Steps**: 
  - Add Vision API calls in `server/routes/ai.ts`
  - Create new `VisionAgent` class in `CorionAgent.ts`
  - Update frontend to display AI-analyzed damage reports

**2. Speech-to-Text Integration**
- **Purpose**: Voice input for AI chat widget
- **Use Case**: Users can speak their questions instead of typing
- **Technology**: OpenAI Whisper API or browser Web Speech API
- **Next Steps**:
  - Add microphone button to AIChatWidget
  - Implement audio recording and transcription
  - Send transcribed text to existing chat flow

**3. Auto-Offerten AI System**
- **Purpose**: Automated quote generation based on photo + description
- **Workflow**: 
  1. User uploads damage photos
  2. GPT Vision analyzes damage type and severity
  3. BusinessAgent generates detailed quote with timeframe
  4. System sends quote via email/WhatsApp
- **Next Steps**:
  - Combine Vision + Business agents
  - Create quote template system
  - Integrate with email/WhatsApp notification system

**4. Corion Hub Tokenization**
- **Purpose**: Internal token management for AI usage tracking
- **Features**: Track API costs per location, user, or service type
- **Next Steps**:
  - Add token counting middleware
  - Create usage dashboard
  - Implement cost allocation system

### Current API Configuration
- **Model**: GPT-4o-mini (cost-effective, fast responses)
- **Temperature**: 0.7 (balanced creativity/consistency)
- **Max Tokens**: 500 (concise responses)
- **Fallback**: German predefined responses if API unavailable
- **Security**: API key stored in Replit Secrets, never exposed to frontend
- **Endpoint**: `/api/ai` (all requests server-side only)

## External Dependencies
- **Google Fonts**: Used for Montserrat and Open Sans typography.
- **Google Business Profile**: Direct linking for customer reviews.
- **OpenAI API (Optional)**: GPT-4o-mini for intelligent chat responses (fallback available if not configured).
- **Google Maps API**: (Future enhancement for automatic review fetching via Google Places API, not currently integrated).