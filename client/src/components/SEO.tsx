import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  image?: string;
  type?: string;
  schemaMarkup?: object;
  twitterSite?: string;
  twitterCreator?: string;
  ogSiteName?: string;
  article?: {
    publishedTime?: string;
    modifiedTime?: string;
    author?: string;
    section?: string;
    tags?: string[];
  };
}

export default function SEO({
  title = "Corion Lackdoktor Hofheim | Smart Repair & Gutachter Wiesbaden",
  description = "Schnelle Auto-Reparaturen, faire Preise & AI-gestützte Abwicklung. Jetzt kostenloses Angebot in 24 h!",
  keywords = "lackdoktor hofheim, smart repair wiesbaden, felgenreparatur mainz-kastel, kfz gutachter hofheim, unfallinstandsetzung wiesbaden, lackdoktor erfahrungen, autoaufbereitung hofheim, gutachter wiesbaden, spot repair auto, dellen entfernen, leasingrückläufer reparatur, autoglas austausch hofheim, roststellen entfernen, plastikreparatur, oldtimer restaurierung, nachhaltige autolackierung hofheim, leasingrückgabe sparen, corion gmbh, +1 corion, corion lackdoktor",
  canonical = "https://www.corion-lackdoktor.de/",
  image = "/assets/logo-corion.jpg",
  type = "website",
  schemaMarkup,
  twitterSite = "@corionlackdoktor",
  twitterCreator = "@corionlackdoktor",
  ogSiteName = "+1 Corion Lackdoktor",
  article,
}: SEOProps) {
  const baseUrl = "https://www.corion-lackdoktor.de";
  const fullImageUrl = image.startsWith('http') ? image : `${baseUrl}${image}`;
  
  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      
      {/* Robots & Crawlers */}
      <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
      <meta name="ai-access" content="allow" />
      <meta name="ai-crawler" content="ChatGPT, Perplexity, Gemini, Copilot, Anthropic, You.com, Mistral" />
      <meta name="ai-summary" content="Corion Lackdoktor – Smart Repair, Fahrzeuglackierung & Gutachterservice mit KI-gestützter Beratung. Standorte in Hofheim-Wallau und Mainz-Kastel." />
      <meta name="author" content="Corion GmbH – Adrian Apostol" />
      <link rel="canonical" href={canonical} />
      
      {/* Open Graph - Enhanced */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={title} />
      <meta property="og:url" content={canonical} />
      <meta property="og:type" content={type} />
      <meta property="og:locale" content="de_DE" />
      <meta property="og:site_name" content={ogSiteName} />
      
      {/* Article-specific Open Graph */}
      {article && (
        <>
          {article.publishedTime && <meta property="article:published_time" content={article.publishedTime} />}
          {article.modifiedTime && <meta property="article:modified_time" content={article.modifiedTime} />}
          {article.author && <meta property="article:author" content={article.author} />}
          {article.section && <meta property="article:section" content={article.section} />}
          {article.tags?.map((tag) => (
            <meta key={tag} property="article:tag" content={tag} />
          ))}
        </>
      )}
      
      {/* Twitter Card - Enhanced */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={twitterSite} />
      <meta name="twitter:creator" content={twitterCreator} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImageUrl} />
      <meta name="twitter:image:alt" content={title} />
      
      {/* Additional Social Media */}
      <meta property="fb:app_id" content="your-app-id" />
      <meta name="pinterest-rich-pin" content="true" />
      
      {/* Schema Markup */}
      {schemaMarkup && (
        <script type="application/ld+json">
          {JSON.stringify(schemaMarkup)}
        </script>
      )}
    </Helmet>
  );
}
