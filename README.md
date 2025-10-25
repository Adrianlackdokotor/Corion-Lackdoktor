# +1 Corion Lackdoktor Web

Official website and CRM management system for **Corion GmbH** — Professional auto body repair services in Wiesbaden, Hofheim, and Mainz-Kastel.

![Corion Lackdoktor](./attached_assets/image007%20(1)_1761130943207.png)

---

## 🚀 Overview

This project delivers a comprehensive, SEO-optimized multi-location website featuring:

- **13+ Detailed Service Pages** (Smart Repair, Lackierung, Gutachter, etc.)
- **AI-Powered Chat Assistant** (GPT-4o-mini integration)
- **Multi-Location Support** (Hofheim-Wallau, Mainz-Kastel, Wiesbaden)
- **Professional Academy Platform** with PaintMaster GPT training courses
- **Secure Admin Dashboard** for CRM management
- **Full Dark/Light Mode** with brand-consistent design
- **SEO & AI-SEO Optimized** (Schema markup, sitemap.xml, llm.txt)

---

## 🛠️ Tech Stack

### **Frontend**
- **React** (v18) with TypeScript
- **TailwindCSS** + **shadcn/ui** components
- **Wouter** for routing
- **React Hook Form** + **Zod** validation
- **TanStack Query** for data fetching
- **Framer Motion** for animations

### **Backend**
- **Express.js** + **Node.js**
- **PostgreSQL** (Neon) with **Drizzle ORM**
- **Passport.js** authentication
- **bcrypt** password hashing
- **Express Session** management

### **Integrations**
- **OpenAI GPT-4o-mini** for AI chat
- **Google Maps** for location integration
- **PHP Email System** (IONOS production)

---

## 📁 Project Structure

```
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components (Home, Services, Admin, etc.)
│   │   ├── hooks/         # Custom React hooks (useAuth, etc.)
│   │   └── lib/           # Utilities and configurations
├── server/                # Express backend
│   ├── routes/           # API endpoints (auth, AI, etc.)
│   ├── auth.ts           # Passport.js authentication
│   └── storage.ts        # Database storage layer
├── shared/               # Shared types and schemas
│   └── schema.ts         # Drizzle ORM database schema
├── db/                   # Database configuration
├── data/                 # Static data files (reviews, services)
├── attached_assets/      # Images and media files
└── public/              # Static assets (sitemap, robots.txt, llm.txt)
```

---

## 🔐 Authentication System

**Secure admin authentication** with:
- Passport.js local strategy (email + password)
- bcrypt password hashing (10 salt rounds)
- Express session management (7-day cookies)
- Protected routes with auto-redirect
- Server-side privilege enforcement

**Admin Access:**
- Login at: `/login`
- Dashboard at: `/admin`
- Email: `adrianlackdoktor@gmail.com`

---

## 🤖 AI Intelligence System

**Dynamic AI Chat Widget** featuring:
- GPT-4o-mini powered responses
- Contextual user intent detection
- Session persistence (localStorage)
- Auto-open for high-intent users
- Comprehensive form tracking
- Privacy-focused (all data stored locally)

---

## 🎨 Design System

- **Typography:** Poppins ExtraBold (headings) + Open Sans (body)
- **Brand Color:** Red `#C00020`
- **Dark Mode:** Pure black `#000000` background (default)
- **Responsive:** Mobile-first design with Tailwind breakpoints
- **Components:** shadcn/ui with custom Corion theming

---

## 📄 Key Pages

| Page | Route | Description |
|------|-------|-------------|
| Home | `/` | Hero, services overview, trust indicators |
| Services | `/leistungen/*` | 13+ detailed service pages |
| Gutachter | `/gutachter` | Expert assessment services |
| Academy | `/academy` | Professional training courses |
| Gallery | `/galerie` | Before/after photo showcase |
| Reviews | `/standorte` | Customer testimonials + locations |
| FAQ | `/faq` | Frequently asked questions |
| Contact | `/kontakt` | Contact form + location info |
| Admin | `/admin` | Protected CRM dashboard |
| Login | `/login` | Authentication page |

---

## 🌐 SEO Optimization

**Traditional SEO:**
- Unique meta tags for all pages
- Schema.org structured data (LocalBusiness, FAQPage)
- Sitemap.xml with all routes
- Open Graph + Twitter Card tags
- Semantic HTML structure

**AI-SEO:**
- `llm.txt` for AI systems (ChatGPT, Gemini, Perplexity)
- AI-briefs (hidden Q&A sections)
- robots.txt allowing AI crawlers
- Comprehensive business data for AI understanding

---

## 🚀 Deployment

### **Development (Replit)**
```bash
npm install
npm run dev
```
Server runs on: `http://localhost:5000`

### **Production (IONOS)**
1. Upload all files via FTP
2. Configure PHP environment for `send_form.php`
3. Set environment variables in hosting panel
4. Point domain to server: `https://www.corion-lackdoktor.de`

**Environment Variables Required:**
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Session encryption key
- `OPENAI_API_KEY` - OpenAI API key (optional)

---

## 📊 Database Schema

### **Users Table**
```typescript
{
  id: serial (primary key)
  email: varchar (unique)
  password: varchar (hashed with bcrypt)
  role: varchar ("user" | "admin")
  emailVerified: boolean
  createdAt: timestamp
}
```

**Migration:**
```bash
npm run db:push
```

---

## 🔒 Security Features

- ✅ Password hashing with bcrypt
- ✅ Server-side privilege escalation prevention
- ✅ HttpOnly session cookies
- ✅ CSRF protection via credentials
- ✅ SQL injection prevention (Drizzle ORM)
- ✅ Environment variables for sensitive data
- ✅ `.gitignore` excludes secrets

---

## 📞 Contact Information

**Corion GmbH**
- **Website:** https://www.corion-lackdoktor.de
- **Email:** coriongmbh@gmail.com
- **Phone:** +49 176 83458274
- **WhatsApp:** [Send Photo](https://wa.me/4917683458274)

**Locations:**
1. **Hofheim-Wallau** (Hauptstandort)
2. **Mainz-Kastel**
3. **Wiesbaden**

---

## 📝 License

© **Corion GmbH 2025** – All rights reserved.

This is proprietary software developed exclusively for Corion GmbH.

---

## 🤝 Development

**Project Manager:** Adrian Lackdoktor  
**Email:** adrianlackdoktor@gmail.com

For development inquiries or support, please contact via email.

---

## 🎯 Future Enhancements

- [ ] Online booking system integration
- [ ] Customer portal for service tracking
- [ ] Invoice generation and management
- [ ] Mobile app (iOS/Android)
- [ ] Multi-language support (English, Turkish)
- [ ] Advanced analytics dashboard

---

**Built with ❤️ for Corion Lackdoktor**
