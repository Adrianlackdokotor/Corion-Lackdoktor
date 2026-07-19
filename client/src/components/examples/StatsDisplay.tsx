import StatsDisplay from '../StatsDisplay';

export default function StatsDisplayExample() {
  const stats = [
    { value: "20+", label: "Jahre Erfahrung", description: "Seit 2003" },
    { value: "4.6/5", label: "Kundenbewertung", description: "642 Bewertungen" },
    { value: "5.000+", label: "Reparaturen", description: "Pro Jahr" },
    { value: "100%", label: "Garantie", description: "Auf alle Arbeiten" },
  ];

  return (
    <div className="p-8">
      <StatsDisplay stats={stats} />
    </div>
  );
}
