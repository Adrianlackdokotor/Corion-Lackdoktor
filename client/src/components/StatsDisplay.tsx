interface StatItem {
  value: string;
  label: string;
  description?: string;
}

interface StatsDisplayProps {
  stats: StatItem[];
}

export default function StatsDisplay({ stats }: StatsDisplayProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
      {stats.map((stat, index) => (
        <div key={index} className="text-center" data-testid={`stat-${stat.label.toLowerCase()}`}>
          <div className="text-3xl md:text-4xl font-bold font-mono text-primary mb-2">
            {stat.value}
          </div>
          <div className="text-sm md:text-base font-semibold mb-1">
            {stat.label}
          </div>
          {stat.description && (
            <div className="text-xs text-muted-foreground">
              {stat.description}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
