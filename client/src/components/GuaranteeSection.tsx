import { Shield, CheckCircle2, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/i18n/LanguageContext";

export default function GuaranteeSection() {
  const { t } = useLanguage();
  
  const guarantees = [
    {
      icon: CheckCircle2,
      title: t("guarantee.2years"),
      description: t("guarantee.2yearsDesc")
    },
    {
      icon: Zap,
      title: t("guarantee.fast"),
      description: t("guarantee.fastDesc")
    },
    {
      icon: Shield,
      title: t("guarantee.transparent"),
      description: t("guarantee.transparentDesc")
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-6 md:p-8 mb-12"
      data-testid="section-guarantee"
    >
      <div className="flex items-start gap-4 mb-6">
        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
          <Shield className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h3 className="text-xl md:text-2xl font-bold mb-2">
            {t("guarantee.title")}
          </h3>
          <p className="text-muted-foreground">
            {t("guarantee.subtitle")}
          </p>
        </div>
      </div>

      {/* Guarantee Benefits Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {guarantees.map((guarantee, index) => {
          const Icon = guarantee.icon;
          return (
            <div
              key={index}
              className="flex items-start gap-3"
              data-testid={`guarantee-item-${index + 1}`}
            >
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm">{guarantee.title}</p>
                <p className="text-xs text-muted-foreground">{guarantee.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
