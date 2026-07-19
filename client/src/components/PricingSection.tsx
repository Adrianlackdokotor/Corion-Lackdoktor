import { TrendingDown, Zap, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/i18n/LanguageContext";

export default function PricingSection() {
  const { t } = useLanguage();
  
  const savingsHighlights = [
    {
      icon: TrendingDown,
      title: t("pricing.smartRepairTitle"),
      subtitle: t("pricing.smartRepairSubtitle"),
      description: t("pricing.smartRepairDesc")
    },
    {
      icon: Zap,
      title: t("pricing.leasingTitle"),
      subtitle: t("pricing.leasingSubtitle"),
      description: t("pricing.leasingDesc")
    },
    {
      icon: Shield,
      title: t("pricing.guaranteeTitle"),
      subtitle: t("pricing.guaranteeSubtitle"),
      description: t("pricing.guaranteeDesc")
    }
  ];

  return (
    <section className="py-16 md:py-24 bg-card/50 border-y">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with Badge */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-primary/20 text-primary hover:bg-primary/30">
            {t("pricing.badge")}
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t("pricing.title")}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("pricing.subtitle")}
          </p>
        </div>

        {/* Savings Cards */}
        <div className="grid md:grid-cols-3 gap-6 md:gap-8 mb-12">
          {savingsHighlights.map((highlight, index) => {
            const Icon = highlight.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full hover-elevate transition-all duration-300" data-testid={`card-savings-${index + 1}`}>
                  <CardContent className="p-6">
                    <div className="mb-4">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <h3 className="text-lg font-semibold mb-1">{highlight.title}</h3>
                      <p className="text-sm text-primary font-semibold">{highlight.subtitle}</p>
                    </div>
                    <p className="text-muted-foreground text-sm">{highlight.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Key Benefit Box */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-8 text-center">
          <p className="text-lg mb-4">
            <span className="font-bold text-primary">{t("pricing.example")}</span> {t("pricing.autoPaintScratch")}
          </p>
          <div className="grid md:grid-cols-3 gap-8 md:gap-4">
            <div>
              <p className="text-muted-foreground text-sm mb-2">{t("pricing.standardPaint")}</p>
              <p className="text-2xl font-bold text-muted-foreground line-through">€500-€1.000</p>
            </div>
            <div className="flex items-center justify-center">
              <div className="text-primary text-3xl font-bold">→</div>
            </div>
            <div>
              <p className="text-muted-foreground text-sm mb-2">{t("pricing.smartRepairCorion")}</p>
              <p className="text-2xl font-bold text-primary">€150-€300</p>
              <p className="text-xs text-primary mt-2">{t("pricing.upTo70Cheaper")}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
