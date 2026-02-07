
import React from "react";
import { Link } from "wouter";
import { ArrowLeft, Wrench, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function MercedesDoor() {
  return (
    <div className="min-h-screen bg-[#111827] text-gray-200 font-sans p-4 md:p-8">
      
      {/* Header Nav */}
      <div className="max-w-4xl mx-auto mb-8">
        <Link href="/academy">
          <Button variant="ghost" className="text-gray-400 hover:text-white pl-0 gap-2">
            <ArrowLeft className="w-4 h-4" /> Zurück zur Academy
          </Button>
        </Link>
      </div>

      <div className="max-w-4xl mx-auto">
        
        {/* Title Section */}
        <div className="mb-8 border-b border-gray-700 pb-6">
          <div className="flex gap-2 mb-4">
            <Badge className="bg-blue-600">Karosserie</Badge>
            <Badge variant="outline" className="text-gray-400 border-gray-600">Mercedes-Benz</Badge>
            <Badge variant="outline" className="text-gray-400 border-gray-600">Level: Profi</Badge>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Türerneuerung & Umbau (B-Klasse)
          </h1>
          <p className="text-gray-400 text-lg">
            Offizielle Arbeitsanweisung für den Austausch der hinteren Tür und Umbau der Anbauteile.
          </p>
        </div>

        {/* Tools Section */}
        <Card className="bg-[#1f2937] border-gray-700 mb-8">
          <CardContent className="p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Wrench className="text-[#c00000]" /> Benötigte Werkzeuge
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Torx T30 (Griff innen/Schloss)</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Torx T25 lang {'>'}150mm (Griff außen)</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Torx T20 (Rahmenblende)</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Steckschlüssel SW 13 (Scharniere)</li>
              </ul>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Bohrmaschine & Bohrer Ø 8mm</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Nietzange & Blindnieten</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Kunststoffkeil (Demontage)</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Step 1 */}
        <div className="space-y-8">
          <div className="relative pl-8 border-l-2 border-gray-700">
            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-[#c00000]" />
            <h3 className="text-xl font-bold text-white mb-4">1. Demontage Innen & Vorbereitung</h3>
            <div className="space-y-4 text-gray-300">
              <p><strong className="text-white">Türinnengriff lösen:</strong> Abdeckung entfernen, Schrauben mit <strong>Torx T30</strong> herausdrehen.</p>
              <p><strong className="text-white">Türverkleidung:</strong> Mit Kunststoffkeil abhebeln, Stecker trennen.</p>
              <p><strong className="text-white">Zugang schaffen:</strong> Gummistopfen am Aggregateträger entfernen.</p>
              <div className="bg-blue-900/20 p-4 rounded border-l-4 border-blue-500 my-4">
                <p className="text-sm text-blue-200">
                  <strong>Wichtig:</strong> Fenster jetzt in "Service-Position" fahren, bis die Schraube durch das Loch sichtbar ist.
                </p>
              </div>
              <p><strong className="text-white">Sicherheit:</strong> Batterie (Minuspol) mit SW 13 abklemmen.</p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="relative pl-8 border-l-2 border-gray-700">
            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-gray-600" />
            <h3 className="text-xl font-bold text-white mb-4">2. Ausbau Scheibe & Anbauteile</h3>
            <div className="space-y-4 text-gray-300">
              <p><strong className="text-white">Schachtleisten:</strong> Innen und außen vorsichtig abziehen.</p>
              <p><strong className="text-white">Rahmenblende:</strong> 3x Torx T20 an der B-Säule lösen.</p>
              <p><strong className="text-white">Scheibe entnehmen:</strong> Klemmschraube (T30) lösen, Scheibe nach oben herausziehen.</p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="relative pl-8 border-l-2 border-gray-700">
            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-gray-600" />
            <h3 className="text-xl font-bold text-white mb-4">3. Aggregateträger & Türblatt</h3>
            <div className="space-y-4 text-gray-300">
              <p><strong className="text-white">Türgriff außen:</strong> Mit langem Torx T25 durch die seitliche Öffnung lösen.</p>
              <p><strong className="text-white">Schloss:</strong> T30 Schrauben lösen.</p>
              <p><strong className="text-white">Aggregateträger:</strong> Nieten mit Ø 8mm aufbohren. Komplette Einheit entnehmen.</p>
              <p><strong className="text-white">Tür abnehmen:</strong> Scharniere mit SW 13 lösen.</p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="relative pl-8 border-l-2 border-gray-700">
            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-green-600" />
            <h3 className="text-xl font-bold text-white mb-4">4. Montage & Finish</h3>
            <div className="space-y-4 text-gray-300">
              <p>Neue Tür lackieren und in umgekehrter Reihenfolge montieren.</p>
              <div className="bg-yellow-900/20 p-4 rounded border-l-4 border-yellow-500 flex gap-3">
                <AlertTriangle className="text-yellow-500 shrink-0" />
                <p className="text-sm text-yellow-200">
                  <strong>Achtung:</strong> Aggregateträger muss neu vernietet werden. Scheibenschraube mit 5-7 Nm anziehen (nicht zu fest!).
                </p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
