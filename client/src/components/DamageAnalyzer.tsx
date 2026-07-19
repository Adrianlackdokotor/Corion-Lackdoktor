import { useState } from 'react';
import { Loader2, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface AnalysisResult {
  suggestedDamageType: string;
  suggestedPriority: string;
  severity?: string;
  analysis: string;
  estimatedCost?: number | null;
  estimatedDays?: number | null;
}

interface DamageAnalyzerProps {
  photos: string[];
  damageDescription: string;
  onAnalysisComplete: (result: AnalysisResult) => void;
}

const severityColors: Record<string, string> = {
  gering: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  mittel: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  schwer: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

const priorityLabels: Record<string, string> = {
  low: 'Niedrig',
  normal: 'Normal',
  high: 'Hoch',
  urgent: 'Dringend',
};

export default function DamageAnalyzer({
  photos,
  damageDescription,
  onAnalysisComplete,
}: DamageAnalyzerProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (photos.length === 0) {
      setError('Bitte laden Sie mindestens ein Foto hoch');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/analyze-damage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photos,
          damageDescription,
        }),
      });

      if (!response.ok) {
        throw new Error('Analyse fehlgeschlagen');
      }

      const data = await response.json();
      setResult(data);
      onAnalysisComplete(data);
    } catch (err) {
      setError('Fehler bei der Bildanalyse. Bitte versuchen Sie es später erneut.');
      console.error('Damage analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">AI-Schadensanalyse</h3>
        </div>

        {!result ? (
          <>
            <p className="text-sm text-muted-foreground">
              Lassen Sie unsere KI Ihre Fotos analysieren, um Schadensart, Dringlichkeit und Kosten automatisch zu erkennen.
            </p>
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing || photos.length === 0}
              className="w-full"
              data-testid="button-analyze-damage"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analysiere Fotos...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Fotos analysieren
                </>
              )}
            </Button>
          </>
        ) : (
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1 flex-1">
                <p className="text-sm font-medium">Analyse abgeschlossen</p>
                <p className="text-sm text-muted-foreground">{result.analysis}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {result.severity && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Schweregrad</p>
                  <Badge
                    className={`${
                      severityColors[result.severity] ||
                      'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                    } capitalize`}
                  >
                    {result.severity}
                  </Badge>
                </div>
              )}

              {result.suggestedPriority && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Dringlichkeit</p>
                  <Badge variant="outline">
                    {priorityLabels[result.suggestedPriority] || result.suggestedPriority}
                  </Badge>
                </div>
              )}

              {result.estimatedCost && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Geschätzte Kosten</p>
                  <Badge variant="secondary">~€{result.estimatedCost}</Badge>
                </div>
              )}
            </div>

            {result.estimatedDays && (
              <div className="text-xs text-muted-foreground">
                <strong>Bearbeitungszeit:</strong> ca. {result.estimatedDays} Tag(e)
              </div>
            )}

            <Button
              onClick={() => {
                setResult(null);
                setError(null);
              }}
              variant="outline"
              size="sm"
              className="w-full"
              data-testid="button-re-analyze"
            >
              Erneut analysieren
            </Button>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 text-destructive">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )}
      </div>
    </Card>
  );
}
