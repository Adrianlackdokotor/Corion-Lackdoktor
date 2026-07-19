import { CheckCircle2, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/i18n/LanguageContext";

export default function ComparisonSection() {
  const { t } = useLanguage();
  
  const comparisonData = [
    {
      feature: t("comparison.speed"),
      corion: "1-2 Tage",
      other: "1-2 Wochen"
    },
    {
      feature: t("comparison.cost"),
      corion: "€200-€400",
      other: "€800-€1.500"
    },
    {
      feature: t("comparison.guarantee"),
      corion: "2 Jahre",
      other: "6 Monate"
    },
    {
      feature: t("comparison.aiSupport"),
      corion: true,
      other: false
    },
    {
      feature: t("comparison.transparent"),
      corion: true,
      other: false
    },
    {
      feature: t("comparison.freeQuotes"),
      corion: true,
      other: false
    },
    {
      feature: t("comparison.pickup"),
      corion: true,
      other: false
    },
    {
      feature: t("comparison.locations"),
      corion: true,
      other: false
    }
  ];

  return (
    <section className="py-16 md:py-24 bg-secondary/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t("comparison.title")}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("comparison.subtitle")}
          </p>
        </div>

        {/* Comparison Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2">
                <th className="text-left py-4 px-4 font-semibold">{t("comparison.feature")}</th>
                <th className="text-center py-4 px-4 font-semibold text-primary">
                  {t("comparison.corion")}
                </th>
                <th className="text-center py-4 px-4 font-semibold text-muted-foreground">
                  {t("comparison.others")}
                </th>
              </tr>
            </thead>
            <tbody>
              {comparisonData.map((row, index) => (
                <tr
                  key={index}
                  className={`border-b ${index % 2 === 0 ? "bg-background" : "bg-secondary/10"}`}
                  data-testid={`comparison-row-${index + 1}`}
                >
                  <td className="py-4 px-4 font-medium">{row.feature}</td>
                  <td className="py-4 px-4 text-center">
                    {typeof row.corion === "boolean" ? (
                      row.corion ? (
                        <CheckCircle2 className="w-6 h-6 text-primary mx-auto" />
                      ) : (
                        <X className="w-6 h-6 text-muted-foreground mx-auto" />
                      )
                    ) : (
                      <span className="font-semibold text-primary">{row.corion}</span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-center">
                    {typeof row.other === "boolean" ? (
                      row.other ? (
                        <CheckCircle2 className="w-6 h-6 text-muted-foreground mx-auto" />
                      ) : (
                        <X className="w-6 h-6 text-muted-foreground mx-auto" />
                      )
                    ) : (
                      <span className="text-muted-foreground">{row.other}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-12">
          <p className="text-lg text-muted-foreground mb-4">
            {t("comparison.convinced")}
          </p>
          <a href="https://wa.me/4917683458274" target="_blank" rel="noopener noreferrer">
            <button
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
              data-testid="button-comparison-cta"
            >
              {t("comparison.photoForQuote")}
            </button>
          </a>
        </div>
      </div>
    </section>
  );
}
