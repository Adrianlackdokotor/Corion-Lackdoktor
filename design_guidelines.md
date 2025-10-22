# Design Guidelines: Lackdoktor Auto Body Repair Website

## Design Approach

**Selected Approach:** Hybrid - Professional Service Industry Best Practices + Modern German Design Sensibility

**Justification:** This is a professional automotive service business requiring trust-building through visual polish while maintaining utility and ease of contact. The design should reflect German precision and professionalism while being warm and approachable.

**Key Design Principles:**
- **Vertrauenswürdigkeit (Trustworthiness):** Professional, polished aesthetic that builds confidence
- **Klarheit (Clarity):** Clear navigation and information hierarchy
- **Handlungsorientiert (Action-Oriented):** Prominent CTAs throughout
- **Beweisbasiert (Evidence-Based):** Visual proof through galleries and testimonials

## Core Design Elements

### A. Color Palette

**Primary Colors (Dark Mode):**
- Background: 20 8% 12% (Deep charcoal)
- Surface: 20 8% 16% (Elevated charcoal)
- Primary Brand: 212 100% 48% (Professional blue - trust, automotive)
- Text Primary: 0 0% 98%
- Text Secondary: 0 0% 70%

**Primary Colors (Light Mode):**
- Background: 0 0% 100% (Pure white)
- Surface: 210 20% 98% (Subtle cool gray)
- Primary Brand: 212 100% 42% (Slightly darker blue for contrast)
- Text Primary: 20 8% 12%
- Text Secondary: 0 0% 40%

**Accent Colors:**
- Success/Active: 142 76% 36% (Professional green - approvals, checkmarks)
- Warning: 25 95% 53% (Amber - caution, important notices)
- Subtle Highlight: 212 30% 25% (Dark mode) / 212 50% 95% (Light mode)

### B. Typography

**Font Families:**
- **Headings:** Inter (weights: 600, 700, 800) - modern, professional, excellent German character support
- **Body:** Inter (weights: 400, 500) - same family for harmony
- **Accent/Numbers:** JetBrains Mono (weight: 500) - for pricing, phone numbers, stats

**Type Scale:**
- Hero Headline: text-5xl md:text-7xl font-bold
- Page Headline: text-4xl md:text-5xl font-bold
- Section Headline: text-3xl md:text-4xl font-semibold
- Card Title: text-xl md:text-2xl font-semibold
- Body Large: text-lg
- Body: text-base
- Small: text-sm

### C. Layout System

**Spacing Primitives:** Use Tailwind units of 4, 6, 8, 12, 16, 20, 24 for consistent rhythm
- Component padding: p-6 md:p-8
- Section spacing: py-16 md:py-24
- Card gaps: gap-6 md:gap-8
- Content margins: mb-4, mb-6, mb-8

**Grid System:**
- Container: max-w-7xl mx-auto px-4 sm:px-6 lg:px-8
- Service cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Feature highlights: grid-cols-1 md:grid-cols-2
- Testimonials: grid-cols-1 lg:grid-cols-2

### D. Component Library

**Navigation:**
- Sticky header with logo left, nav center, CTA button right
- Mobile: Hamburger menu with smooth slide-in drawer
- Include phone number in header on desktop
- Highlight "Angebot einholen" (Get Quote) button

**Hero Section:**
- Full-width with professional automotive image (workshop/repaired car)
- Overlay gradient for text readability
- Large headline + subheadline + dual CTAs (Primary: "Kostenvoranschlag", Secondary: "Anrufen")
- Trust indicators below CTAs (20+ Jahre, 642 Bewertungen, Kostenloser Service)

**Service Cards:**
- Image (before/after or service icon) at top
- Service name as heading
- Brief 2-3 sentence description
- "Mehr erfahren" link
- Hover: subtle lift effect and border highlight

**Contact Forms:**
- Clear labels above inputs
- Large, accessible form fields
- File upload with drag-drop area
- WhatsApp quick contact button
- Phone numbers as clickable links
- Success/error states with clear feedback

**Testimonial Cards:**
- Customer name and date
- 5-star rating display
- Quote text
- Optional small avatar placeholder
- Source badge (Google, Facebook)

**Gallery:**
- Masonry-style grid for before/after images
- Lightbox on click
- Category filters (service type)
- Lazy loading for performance

**CTAs:**
- Primary: Solid blue background, white text, rounded corners
- Secondary: Outline style with blur background on images
- Sizes: Large (hero), Medium (sections), Small (cards)
- Always include icon (phone, email, arrow)

**Data Display:**
- Stats counters: Large numbers in JetBrains Mono
- Comparison tables: Striped rows, highlight Lackdoktor column
- Pricing indicators: Clear hierarchy, emphasize value
- Location cards: Map thumbnail, address, contact methods

### E. Images

**Hero Section:**
- Large hero image: Professional automotive workshop interior or pristine repaired vehicle
- Dimensions: 1920x800px minimum
- Style: High-quality photography, slightly desaturated for professional feel
- Overlay: Dark gradient (bottom to top) for text readability

**Service Pages:**
- Header image per service showing specific repair type
- Before/after comparison sliders where applicable
- Process step illustrations
- Equipment/technology photos

**Gallery:**
- Before/after transformation photos (primary content)
- Workshop facility images
- Team photos for trust-building
- Completed project showcase

**General Image Strategy:**
- Use professional automotive photography
- Maintain consistent color grading (slightly cool tone)
- Show real work examples, not stock photos when possible
- Optimize all images to WebP format
- Implement lazy loading

### F. Animations

**Minimal, Purpose-Driven Only:**
- Smooth scroll behavior for anchor links
- Fade-in on scroll for testimonials and service cards (subtle, once)
- Hover states: gentle scale (1.02) and shadow increase on cards
- Form validation: shake animation on error
- Success messages: slide down from top
- Navigation: smooth color transitions
- **No:** parallax, excessive motion, autoplay carousels

### G. Mobile-First Considerations

- Touch-friendly tap targets (min 44px height)
- Sticky "Jetzt Anrufen" button on mobile
- Simplified navigation with clear hierarchy
- Stack service cards vertically on mobile
- Larger font sizes for readability
- WhatsApp integration prominent on mobile
- One-tap phone number calling

## Page-Specific Guidelines

**Homepage:**
- Hero with main CTA
- 3-column quick service highlights
- Trust indicators (years, reviews, certifications)
- Featured services grid (6 cards)
- Testimonials carousel (2-3 visible)
- Location map with contact info
- Footer with full navigation

**Service Pages:**
- Service-specific hero image
- Detailed description (2-3 paragraphs)
- Benefits list with checkmarks
- Process steps (numbered)
- Pricing indicator or "Request Quote" CTA
- Related services suggestions
- FAQ accordion specific to service

**Contact Page:**
- Two-column layout: Form left, Info right
- Multiple contact methods prominently displayed
- Embedded Google Maps for each location
- Opening hours clearly stated
- File upload for damage photos
- Free services highlighted (Leihwagen, Abhol-Service)

**Testimonials:**
- Filter by rating/service type
- Large quote cards with full reviews
- Aggregate rating display at top
- Link to Google Business profile
- Video testimonials if available

This design system prioritizes German market expectations for professionalism, builds trust through visual quality, and optimizes for mobile-first local SEO success.