
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Download, Calculator, Euro } from "lucide-react";

export default function MeisterProjekt() {
  // Configurare Prețuri (Bazat pe Facturi Reale & DEKRA)
  const HOURLY_RATE = 145.00; // Premium / Regional Bekannt
  const MATERIAL_FACTOR = 1.45; // 45% Aufschlag

  // State pentru Calculator
  const [hours, setHours] = useState({
    demontage: 2.5,
    vorbereitung: 2.0,
    lackierung: 1.5,
    design: 3.0,
    montage: 2.0
  });

  const [materials, setMaterials] = useState(250.00); // Pauschal Lack + Design

  // Calcule Live
  const laborCost = (Object.values(hours).reduce((a, b) => a + b, 0) * HOURLY_RATE);
  const materialCost = materials; // Preț final client
  const netTotal = laborCost + materialCost;
  const grossTotal = netTotal * 1.19;

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans p-8 print:bg-white print:p-0">
      
      {/* Header Proiect */}
      <div className="max-w-4xl mx-auto mb-12 print:hidden">
        <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-red-700">Meisterprüfungsprojekt: Mercedes C-Klasse</h1>
            <Button className="bg-red-700 hover:bg-red-800 text-white gap-2" onClick={() => window.print()}>
                <Download className="w-4 h-4" /> PDF Speichern / Drucken
            </Button>
        </div>
        <p className="text-gray-600">
            Digitale Kalkulation & Angebotserstellung (Forum HisTa Corporate Design).
        </p>
      </div>

      {/* DOCUMENTUL DEVIZ (A4 Style) */}
      <Card className="max-w-[210mm] mx-auto bg-white shadow-xl print:shadow-none border border-gray-200 print:border-none min-h-[297mm] p-12">
        
        {/* Antet */}
        <div className="flex justify-between items-start mb-12 border-b-2 border-red-700 pb-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">CORION GmbH</h2>
                <p className="text-sm text-gray-500">Lackierfachbetrieb & Design</p>
                <p className="text-sm text-gray-500">Nassaustr. 41, 65719 Hofheim</p>
            </div>
            <div className="text-right">
                <h3 className="text-xl font-bold text-gray-400">KOSTENVORANSCHLAG</h3>
                <p className="font-mono text-sm">Nr. MP-2026-001</p>
                <p className="text-sm text-gray-500">Datum: 01.03.2026</p>
            </div>
        </div>

        {/* Detalii Vehicul */}
        <div className="grid grid-cols-2 gap-8 mb-12 bg-gray-50 p-4 rounded border border-gray-100">
            <div>
                <p className="text-xs text-gray-400 uppercase font-bold">Fahrzeug</p>
                <p className="font-bold">Mercedes-Benz C-Klasse (W206)</p>
                <p className="text-sm">Baujahr 2025</p>
            </div>
            <div>
                <p className="text-xs text-gray-400 uppercase font-bold">Auftrag</p>
                <p className="font-bold">Unfallinstandsetzung & Gestaltung</p>
                <p className="text-sm">Türerneuerung links + Designlackierung</p>
            </div>
        </div>

        {/* Tabel Calculator (Interactiv) */}
        <div className="mb-8">
            <h3 className="font-bold text-lg mb-4 border-b border-gray-200 pb-2">1. Arbeitslohn (Manoperă)</h3>
            <div className="space-y-2">
                <Row label="Karosserie (Demontage/Montage)" value={hours.demontage} onChange={(v) => setHours({...hours, demontage: v})} rate={HOURLY_RATE} />
                <Row label="Vorbereitung (Schleifen, Füllern)" value={hours.vorbereitung} onChange={(v) => setHours({...hours, vorbereitung: v})} rate={HOURLY_RATE} />
                <Row label="Lackierung (Basis & Klarlack)" value={hours.lackierung} onChange={(v) => setHours({...hours, lackierung: v})} rate={HOURLY_RATE} />
                <Row label="Gestaltung & Design (Logo/Sonder)" value={hours.design} onChange={(v) => setHours({...hours, design: v})} rate={HOURLY_RATE} highlight />
            </div>
            <div className="flex justify-end mt-4 pt-2 border-t border-gray-300">
                <p className="font-bold">{laborCost.toFixed(2)} €</p>
            </div>
        </div>

        <div className="mb-12">
            <h3 className="font-bold text-lg mb-4 border-b border-gray-200 pb-2">2. Material (PPG/Mipa/3M)</h3>
            <div className="flex justify-between items-center py-2">
                <div className="w-2/3">
                    <p className="font-medium">Lackmaterial & Kleinmaterial (Pauschal)</p>
                    <p className="text-xs text-gray-500">Inkl. PPG Envirobase, UHS Klarlack, 3M Trizact, Abdeckmaterial</p>
                </div>
                <div className="w-1/3 flex items-center justify-end gap-4 print:hidden">
                    <Input 
                        type="number" 
                        value={materials} 
                        onChange={(e) => setMaterials(parseFloat(e.target.value))}
                        className="w-24 text-right"
                    />
                    <span>€</span>
                </div>
                <div className="hidden print:block font-bold text-right">
                    {materials.toFixed(2)} €
                </div>
            </div>
        </div>

        {/* Total General */}
        <div className="bg-gray-900 text-white p-6 rounded-lg print:bg-gray-100 print:text-black print:border print:border-gray-300">
            <div className="flex justify-between mb-2">
                <span>Nettobetrag</span>
                <span>{netTotal.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between mb-4 text-gray-400 print:text-gray-600">
                <span>MwSt. (19%)</span>
                <span>{(grossTotal - netTotal).toFixed(2)} €</span>
            </div>
            <Separator className="bg-gray-700 my-4 print:bg-gray-400" />
            <div className="flex justify-between text-2xl font-bold">
                <span>Gesamtbetrag</span>
                <span>{grossTotal.toFixed(2)} €</span>
            </div>
        </div>

        {/* Footer Document */}
        <div className="mt-12 text-center text-xs text-gray-400 print:absolute print:bottom-12 print:left-0 print:right-0">
            <p>Kalkulation erstellt mit Corion Digital OS. Preise basieren auf regionalen Marktpreisen (Hofheim 65719).</p>
            <p>Es gelten unsere AGB. Zahlbar sofort nach Rechnungserhalt ohne Abzug.</p>
        </div>

      </Card>

      {/* Asset Links (Ascunse la print) */}
      <div className="max-w-4xl mx-auto mt-12 print:hidden grid grid-cols-2 gap-4">
        <Card className="bg-white hover:bg-gray-50 cursor-pointer transition border-l-4 border-l-blue-500">
            <CardContent className="p-4 flex items-center gap-4">
                <div className="bg-blue-100 p-3 rounded-full"><Download className="text-blue-600" /></div>
                <div>
                    <h4 className="font-bold">Materialliste.pdf</h4>
                    <p className="text-xs text-gray-500">PPG/Mipa Bestandsliste</p>
                </div>
            </CardContent>
        </Card>
        <Card className="bg-white hover:bg-gray-50 cursor-pointer transition border-l-4 border-l-green-500">
            <CardContent className="p-4 flex items-center gap-4">
                <div className="bg-green-100 p-3 rounded-full"><Calculator className="text-green-600" /></div>
                <div>
                    <h4 className="font-bold">DEKRA Vergleich.pdf</h4>
                    <p className="text-xs text-gray-500">Stundensätze 2025</p>
                </div>
            </CardContent>
        </Card>
      </div>

    </div>
  );
}

// Helper Component pentru Rânduri Editabile
interface RowProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  rate: number;
  highlight?: boolean;
}
function Row({ label, value, onChange, rate, highlight }: RowProps) {
    return (
        <div className={`flex justify-between items-center py-2 ${highlight ? 'bg-yellow-50 -mx-2 px-2 rounded' : ''}`}>
            <div className="w-1/2 font-medium">{label}</div>
            <div className="w-1/4 flex items-center gap-2 print:hidden">
                <Input 
                    type="number" 
                    step="0.5"
                    value={value} 
                    onChange={(e) => onChange(parseFloat(e.target.value))}
                    className="w-20 text-right h-8"
                />
                <span className="text-xs text-gray-500">Std.</span>
            </div>
            <div className="hidden print:block w-1/4 text-center">
                {value.toFixed(2)} Std.
            </div>
            <div className="w-1/4 text-right">
                {(value * rate).toFixed(2)} €
            </div>
        </div>
    )
}
