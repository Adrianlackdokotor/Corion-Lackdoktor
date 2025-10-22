# +1 Corion Lackdoktor Website

## Project Overview
Professional website for +1 Corion Lackdoktor, a German auto body repair shop serving Wiesbaden, Hofheim-Wallau, and Mainz-Kastel regions. The site features 13+ service pages, multi-location support, testimonials, gallery, FAQ, and legal pages.

**Last Updated**: October 22, 2025  
**Status**: ✅ Complete - Ready for German content insertion

---

## 🎨 Brand Identity

### Corporate Colors
- **Primary Red**: `#C00020` (hsl: 350 100% 38%)
  - Used for: Buttons, links, accents, CTAs
- **White**: `#FFFFFF` - Clean backgrounds
- **Black**: `#000000` - Text and contrasts
- **Light Gray**: `#F2F2F2` - Subtle backgrounds

### Typography
- **Primary Font (Headings)**: Montserrat - All H1, H2, H3, buttons
- **Secondary Font (Body)**: Open Sans - Paragraphs, text content
- **Configured in**: `tailwind.config.ts` with `font-heading` class

### Logo
- Main logo: `attached_assets/image007 (1)_1761130943207.png`
- Gutachter variant: `attached_assets/+1CorionGutachter_On_Black (High)_1761130748086.jpg`
- Used throughout header/footer

### Contact Information
- **Phone**: 0176 834 582 74 (consistent across entire site)
- **WhatsApp**: Available via contact page
- **Email**: info@lackdoktor.de

---

## 📁 Project Structure

### Pages (All Complete)
```
/                           - Homepage with hero, services, testimonials
/leistungen/unfallschaeden  - Accident damage repair
/leistungen/lackschaeden    - Paint damage repair
/leistungen/smart-repair    - Smart repair (spot repair)
/leistungen/dellen-entfernen - Dent removal
/leistungen/leasingruecklaufer - Lease return preparation
/leistungen/felgenreparaturen - Wheel repairs
/leistungen/rostschaeden    - Rust damage
/leistungen/oldtimer        - Classic car restoration
/leistungen/autoaufbereitung - Auto detailing
/leistungen/baulackierung   - Full paint job
/leistungen/autoglas        - Auto glass
/leistungen/sonderlackierung - Special paint finishes
/leistungen/plastikreparatur - Plastic repair
/gutachter                  - Damage assessment service
/galerie                    - Photo gallery with filters
/kontakt                    - Contact form + locations
/uber-uns                   - About page
/bewertungen                - Customer reviews (642 reviews, 4.6/5)
/standorte                  - Multi-location page
/faq                        - Frequently asked questions
/impressum                  - Legal imprint
/datenschutz                - Privacy policy
/cookies                    - Cookie policy
```

### Key Components
- **Header**: Sticky navigation with dropdown menu for all 13 services
- **Footer**: Company info, service links, locations, legal links
- **Hero**: Full-screen hero with CTAs and trust indicators
- **ServiceCard**: Reusable card for service display
- **ServicePage**: Template for all 13 service pages
- **TestimonialCard**: Customer review display
- **LocationCard**: Location information with map/hours
- **ContactForm**: Form with name, email, phone, message, file upload
- **StatsDisplay**: Statistics display component

---

## 🎯 Key Features

### Multi-Location Support
Three locations configured:
1. **Wiesbaden** - Main location
2. **Hofheim-Wallau** - Wiesbadener Straße
3. **Mainz-Kastel** - Wiesbadener Strasse 30

### Trust Indicators
- 20+ years experience (since 2003)
- 4.6/5 rating from 642 reviews
- 100% guarantee on all work
- 5,000+ repairs per year

### Free Services Highlighted
- Free courtesy car during repairs
- Free pickup and delivery service
- Free quote/estimate

### Gallery with Filters
Categories: Alle, Lackierung, Unfallschäden, Smart Repair, Oldtimer, Felgen, Aufbereitung

---

## 🛠 Technical Stack

### Frontend
- **React** 18.x with TypeScript
- **Wouter** for routing (not React Router!)
- **Tailwind CSS** for styling
- **shadcn/ui** components
- **React Hook Form** + Zod validation
- **Lucide React** for icons

### Styling Configuration
All brand colors configured in `client/src/index.css`:
- Primary color: hsl(350 100% 38%) in light mode
- Primary color: hsl(350 100% 45%) in dark mode
- Custom elevation system with hover-elevate/active-elevate-2

### Fonts
Loaded via Google Fonts in `client/index.html`:
```html
Montserrat: wght@300;400;500;600;700;800;900
Open Sans: wght@300;400;500;600;700;800
```

---

## 📝 Content Status

### ✅ Complete Architecture
- All 13 service pages created
- All legal pages (Impressum, Datenschutz, Cookies)
- Complete navigation structure
- All components functional
- Brand identity fully integrated

### 📌 Placeholder Content
All pages contain **German placeholder text** ready for client to replace with:
- Actual service descriptions
- Real customer testimonials
- Company history details
- Specific pricing information
- Legal/imprint details
- Actual location addresses

### 🖼️ Images
Current images are AI-generated placeholders in:
- `attached_assets/generated_images/`
  - Professional_workshop_hero_image_5d91be84.png (hero)
  - Paint_service_image_68d4cdbf.png (paint services)
  - Dent_removal_service_image_b9ce6b23.png (dent removal)
  - Wheel_repair_service_image_878b7e9d.png (wheel repair)
  - Auto_detailing_service_image_222c746b.png (detailing)
  - Classic_car_restoration_image_360d4f59.png (oldtimer)

**Client needs to**: Replace with real workshop photos, before/after examples

---

## 🚀 Deployment Notes

### User Will Handle IONOS Deployment
- User will deploy independently to IONOS
- Site is static/client-side only (no database needed)
- Build command: `npm run build`
- Output directory: `dist/`

### Environment
- No environment variables needed
- No API keys required
- Pure frontend application
- Contact form currently logs to console (user can connect to email service)

---

## ✏️ Content Insertion Guide for Client

### How to Update German Content

1. **Service Pages** (`client/src/pages/services/*.tsx`):
   - Replace `benefits` array with actual service benefits
   - Replace `process` array with actual workflow steps
   - Update `pricing` with real prices
   - Replace service descriptions

2. **Homepage** (`client/src/pages/Home.tsx`):
   - Update testimonials with real customer reviews
   - Modify service descriptions in `featuredServices`
   - Update stats if needed

3. **About Page** (`client/src/pages/About.tsx`):
   - Replace company history text
   - Update team information
   - Modify values and guarantees

4. **Contact Page** (`client/src/pages/Contact.tsx`):
   - Update location addresses (currently placeholder)
   - Verify phone numbers
   - Update opening hours if different

5. **Legal Pages**:
   - `client/src/pages/Impressum.tsx` - Add company details, VAT ID
   - `client/src/pages/Datenschutz.tsx` - Update with actual privacy policy
   - `client/src/pages/Cookies.tsx` - Update cookie policy

6. **FAQ** (`client/src/pages/FAQ.tsx`):
   - Review and update Q&A pairs
   - Add/remove questions as needed

### Replacing Images
Replace placeholder images with real photos:
- Hero image: Update `heroImage` import in `client/src/components/Hero.tsx`
- Service images: Update imports in each service page file
- Gallery: Add real before/after photos in `client/src/pages/Gallery.tsx`

---

## 🎨 Design System

### Color Usage
```css
bg-primary         - Red background (#C00020)
text-primary       - Red text
border-primary     - Red border
hover-elevate      - Subtle hover effect (built-in)
active-elevate-2   - Press effect (built-in)
```

### Typography Classes
```css
font-heading       - Montserrat (for H1-H6)
font-sans          - Open Sans (body text)
text-4xl md:text-5xl - Responsive heading sizes
text-lg            - Standard paragraph size
```

### Common Patterns
- CTAs use primary color with white text
- Cards use subtle shadows and borders
- All interactive elements have hover/active states
- Mobile-first responsive design

---

## 📱 Responsive Behavior

### Breakpoints (Tailwind defaults)
- `sm:` 640px - Small tablets
- `md:` 768px - Tablets
- `lg:` 1024px - Desktop
- `xl:` 1280px - Large desktop

### Mobile Features
- Hamburger menu for navigation
- Collapsible service submenu
- Touch-friendly buttons and links
- Optimized images for mobile

---

## 🔄 Recent Changes (October 22, 2025)

1. **Brand Identity Integration**:
   - Updated all colors to #C00020 (red)
   - Integrated Montserrat and Open Sans fonts
   - Added logo to header and footer

2. **Phone Number Consistency**:
   - Standardized to 0176 834 582 74 across all pages
   - Updated contact cards, service pages, FAQ

3. **Service Pages**:
   - Created all 13 service landing pages
   - Each with unique benefits, process, pricing
   - Consistent layout using ServicePage template

4. **Navigation**:
   - Fixed "Leistungen" to link to first service
   - Dropdown shows all 13 services
   - Sticky header with blur effect

5. **Legal Pages**:
   - Added Impressum, Datenschutz, Cookie-Richtlinie
   - Linked in footer

---

## ✅ Testing Results

End-to-end test completed successfully:
- All pages accessible and functioning
- Navigation works correctly
- Forms validate properly
- Gallery filters work
- Mobile responsive
- Brand colors consistent
- All links working

---

## 📋 User Preferences

### Development Approach
- User prefers architecture-first, content later
- Will handle IONOS deployment independently
- Wants German content placeholders
- Focused on professional, clean design

### Design Choices
- Montserrat for modern, professional headings
- Open Sans for readable body text
- Red (#C00020) as primary to match brand
- Multi-location support emphasized
- Trust indicators prominently displayed

---

## 🎯 Next Steps for Client

1. **Content Replacement**:
   - [ ] Replace all German placeholder text with actual content
   - [ ] Add real customer testimonials
   - [ ] Update company history and team info
   - [ ] Fill in legal pages (Impressum, Datenschutz)

2. **Images**:
   - [ ] Replace hero image with real workshop photo
   - [ ] Add before/after photos to gallery
   - [ ] Replace service page images with actual work examples

3. **Contact Form**:
   - [ ] Connect to email service (currently logs to console)
   - [ ] Test file upload functionality
   - [ ] Verify WhatsApp integration

4. **Final Checks**:
   - [ ] Verify all phone numbers correct
   - [ ] Check opening hours for each location
   - [ ] Test all external links
   - [ ] Review SEO meta tags

5. **Deployment**:
   - [ ] Build: `npm run build`
   - [ ] Upload to IONOS hosting
   - [ ] Configure domain
   - [ ] Test live site

---

## 📞 Support

**Project Type**: Static website  
**Framework**: React + Vite + Tailwind  
**Ready for**: Content insertion and IONOS deployment  
**Status**: ✅ Fully functional, tested, and ready
