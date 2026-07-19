import { useState, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Printer, Trash2, X, Plus, Camera, Save, Euro, Calculator,
  Scan, MessageCircle, Mail, ChevronDown, Globe, User as UserIcon, Building2, ArrowLeft
} from "lucide-react";
import SEO from "@/components/SEO";
import type { User as UserType } from "@shared/schema";

// ── Translations ────────────────────────────────────────────────────────────
type Lang = "de" | "ro" | "es";

const T = {
  de: {
    title: "Fahrzeug Auftrags-/Annahme-Protokoll",
    subtitle: "+1 Corion Lackdoktor – Smart Repair",
    viewLeft: "Linke Seite", viewTop: "Draufsicht", viewRight: "Rechte Seite",
    legendSelected: "Ausgewählt", legendAvail: "Verfügbar", legendZones: "Gestrichelt = 3 Zonen",
    photoTitle: "Fotos / Dokumentation", addPhoto: "Foto hinzufügen",
    photoDrop: "Klicken um Fotos hinzuzufügen",
    kfzTitle: "Fahrzeugschein scannen (KI-OCR)",
    kfzBtn: "Zulassungsbescheinigung scannen",
    kfzLoading: "Fahrzeugdaten werden extrahiert...",
    sectionCrm: "Kundendaten",
    sectionVehicle: "Fahrzeugdaten",
    sectionRepairs: "LEISTUNGEN / Reparaturpositionen",
    emptyRepairs: "Klicken Sie auf die Fahrzeugskizze um Positionen hinzuzufügen",
    fieldName: "Name", fieldAb: "AB/AG Nummer", fieldPhone: "Telefon", fieldEmail: "E-Mail",
    fieldAddress: "Adresse", fieldMake: "Marke", fieldModel: "Modell", fieldPlate: "Kennzeichen",
    fieldColor: "Farbe", fieldVin: "FIN/VIN", fieldMileage: "Kilometerstand",
    partner: "Partner zuweisen", noPartner: "Kein Partner",
    abBring: "Hol-/Bring-Service (30km)", abBringPrice: "59 €",
    leihwagen: "Leihwagen", leihwagenPrice: "39 €/Tag",
    netLabel: "Nettobetrag (ohne MwSt.)", vat19: "MwSt. 19%", gross: "Gesamtbetrag (inkl. MwSt.)",
    zoneAll: "Gesamt", zoneTop: "Oben", zoneMid: "Mitte", zoneBot: "Unten",
    addBtn: "Hinzufügen", updateBtn: "Aktualisieren",
    printAdmin: "Admin-Auftrag drucken", printPartner: "Partnerauftrag drucken", printClient: "Kunden-Auftrag drucken",
    shareWA: "WhatsApp", shareEmail: "E-Mail senden", saveCrm: "CRM speichern",
    emailDlgTitle: "Auftrag per E-Mail senden", emailDlgTo: "Empfänger E-Mail",
    emailDlgSend: "Senden", emailDlgMode: "Version",
    services: {
      polieren: "Polieren",
      lackieren: "Lackieren",
      komplett: "Komplettlackierung",
      inst_lack: "Inst. u. Lackieren",
      ausbeulen: "Ausbeulen u. Lackieren",
      retusche: "Lackierretusche",
    },
    partnerPrintTitle: "Werkstattauftrag (Partnerversion)",
    partnerPrintNote: "Keine Kundendaten · Nur Fahrzeug & Arbeitsumfang",
    clientPrintTitle: "Auftragsbestätigung",
    adminPrintTitle: "Vollständiger Auftrag (Admin)",
    sigCustomer: "Datum / Unterschrift Kunde", sigShop: "Unterschrift Lackdoktor",
    warranty: "5 Jahre Gewährleistung | Smart Repair Spezialist | Leasing-Rückgabe Experte",
    legalText: "Durch meine Unterschrift bestätige ich, dass ich die Kosten und Details des vorliegenden Reparaturauftrags verstanden habe und damit einverstanden bin.",
  },
  ro: {
    title: "Protocol de Primire / Comandă Vehicul",
    subtitle: "+1 Corion Lackdoktor – Smart Repair",
    viewLeft: "Partea Stângă", viewTop: "Vedere de Sus", viewRight: "Partea Dreaptă",
    legendSelected: "Selectat", legendAvail: "Disponibil", legendZones: "Punctat = 3 Zone",
    photoTitle: "Fotografii / Documentare", addPhoto: "Adaugă Fotografie",
    photoDrop: "Click pentru a adăuga fotografii",
    kfzTitle: "Scanare Talon (AI-OCR)",
    kfzBtn: "Scanează Talonul / Certificatul de înmatriculare",
    kfzLoading: "Extragere date vehicul...",
    sectionCrm: "Date Client",
    sectionVehicle: "Date Vehicul",
    sectionRepairs: "LUCRĂRI / Poziții Reparație",
    emptyRepairs: "Apăsați pe schița vehiculului pentru a adăuga poziții",
    fieldName: "Nume", fieldAb: "Nr. AB/AG", fieldPhone: "Telefon", fieldEmail: "E-Mail",
    fieldAddress: "Adresă", fieldMake: "Marcă", fieldModel: "Model", fieldPlate: "Nr. Înmatriculare",
    fieldColor: "Culoare", fieldVin: "Serie șasiu / VIN", fieldMileage: "Kilometraj",
    partner: "Atribuie Partener", noPartner: "Fără Partener",
    abBring: "Serviciu Preluare/Predare (30km)", abBringPrice: "59 €",
    leihwagen: "Mașină de Înlocuire", leihwagenPrice: "39 €/Zi",
    netLabel: "Total net (fără TVA)", vat19: "TVA 19%", gross: "Total (cu TVA)",
    zoneAll: "Total", zoneTop: "Sus", zoneMid: "Mijloc", zoneBot: "Jos",
    addBtn: "Adaugă", updateBtn: "Actualizează",
    printAdmin: "Print Admin", printPartner: "Print Partener", printClient: "Print Client",
    shareWA: "WhatsApp", shareEmail: "Trimite E-Mail", saveCrm: "Salvează CRM",
    emailDlgTitle: "Trimite Comanda prin E-Mail", emailDlgTo: "E-Mail Destinatar",
    emailDlgSend: "Trimite", emailDlgMode: "Versiune",
    services: {
      polieren: "Polisat", lackieren: "Vopsit", komplett: "Vopsire Completă",
      inst_lack: "Înlocuire + Vopsit", ausbeulen: "Îndreptat + Vopsit", retusche: "Retuș Vopsit",
    },
    partnerPrintTitle: "Comandă Atelier (versiunea partenerului)",
    partnerPrintNote: "Fără date client · Doar vehicul & lucrări de executat",
    clientPrintTitle: "Confirmare Comandă",
    adminPrintTitle: "Comandă Completă (Admin)",
    sigCustomer: "Data / Semnătura Client", sigShop: "Semnătura Lackdoktor",
    warranty: "5 Ani Garanție | Specialist Smart Repair | Expert Returnare Leasing",
    legalText: "Prin semnătura mea confirm că am înțeles costurile și detaliile comenzii de reparație și sunt de acord cu acestea.",
  },
  es: {
    title: "Protocolo de Recepción del Vehículo",
    subtitle: "+1 Corion Lackdoktor – Smart Repair",
    viewLeft: "Lado Izquierdo", viewTop: "Vista Superior", viewRight: "Lado Derecho",
    legendSelected: "Seleccionado", legendAvail: "Disponible", legendZones: "Punteado = 3 Zonas",
    photoTitle: "Fotos / Documentación", addPhoto: "Agregar Foto",
    photoDrop: "Clic para agregar fotos",
    kfzTitle: "Escanear Permiso de Circulación (IA-OCR)",
    kfzBtn: "Escanear Permiso de Circulación",
    kfzLoading: "Extrayendo datos del vehículo...",
    sectionCrm: "Datos del Cliente",
    sectionVehicle: "Datos del Vehículo",
    sectionRepairs: "TRABAJOS / Posiciones de Reparación",
    emptyRepairs: "Haga clic en el esquema del vehículo para agregar posiciones",
    fieldName: "Nombre", fieldAb: "N° AB/AG", fieldPhone: "Teléfono", fieldEmail: "E-Mail",
    fieldAddress: "Dirección", fieldMake: "Marca", fieldModel: "Modelo", fieldPlate: "Matrícula",
    fieldColor: "Color", fieldVin: "Bastidor/VIN", fieldMileage: "Kilometraje",
    partner: "Asignar Socio", noPartner: "Sin Socio",
    abBring: "Servicio Recogida/Entrega (30km)", abBringPrice: "59 €",
    leihwagen: "Vehículo de Sustitución", leihwagenPrice: "39 €/Día",
    netLabel: "Importe neto (sin IVA)", vat19: "IVA 19%", gross: "Total (con IVA)",
    zoneAll: "Total", zoneTop: "Arriba", zoneMid: "Medio", zoneBot: "Abajo",
    addBtn: "Agregar", updateBtn: "Actualizar",
    printAdmin: "Imprimir Admin", printPartner: "Imprimir Socio", printClient: "Imprimir Cliente",
    shareWA: "WhatsApp", shareEmail: "Enviar E-Mail", saveCrm: "Guardar CRM",
    emailDlgTitle: "Enviar Pedido por E-Mail", emailDlgTo: "E-Mail Destinatario",
    emailDlgSend: "Enviar", emailDlgMode: "Versión",
    services: {
      polieren: "Pulido", lackieren: "Pintura parcial", komplett: "Pintura completa",
      inst_lack: "Sustitución + Pintura", ausbeulen: "Abolladuras + Pintura", retusche: "Retoque de pintura",
    },
    partnerPrintTitle: "Orden de Taller (versión socio)",
    partnerPrintNote: "Sin datos del cliente · Solo vehículo y trabajos",
    clientPrintTitle: "Confirmación de Pedido",
    adminPrintTitle: "Pedido Completo (Admin)",
    sigCustomer: "Fecha / Firma Cliente", sigShop: "Firma Lackdoktor",
    warranty: "5 Años Garantía | Especialista Smart Repair | Experto Devolución Leasing",
    legalText: "Con mi firma confirmo que he entendido los costes y detalles del pedido de reparación y estoy de acuerdo con ellos.",
  },
};

const SERVICE_KEYS = ["polieren", "lackieren", "komplett", "inst_lack", "ausbeulen", "retusche"] as const;
type ServiceKey = typeof SERVICE_KEYS[number];

const SERVICE_COLORS: Record<ServiceKey, string> = {
  polieren:   "bg-yellow-500/20 text-yellow-300 border-yellow-500/40",
  lackieren:  "bg-red-500/20 text-red-300 border-red-500/40",
  komplett:   "bg-pink-600/20 text-pink-300 border-pink-600/40",
  inst_lack:  "bg-purple-500/20 text-purple-300 border-purple-500/40",
  ausbeulen:  "bg-orange-500/20 text-orange-300 border-orange-500/40",
  retusche:   "bg-green-500/20 text-green-300 border-green-500/40",
};

// ── Per-service print colors (white background) ───────────────────────────
const SERVICE_PRINT_COLORS: Record<ServiceKey, { fill: string; stroke: string; text: string; dot: string }> = {
  polieren:   { fill: "#fef9c3", stroke: "#ca8a04", text: "#713f12", dot: "#eab308" },
  lackieren:  { fill: "#fee2e2", stroke: "#dc2626", text: "#7f1d1d", dot: "#ef4444" },
  komplett:   { fill: "#fce7f3", stroke: "#db2777", text: "#500724", dot: "#ec4899" },
  inst_lack:  { fill: "#ede9fe", stroke: "#7c3aed", text: "#2e1065", dot: "#8b5cf6" },
  ausbeulen:  { fill: "#ffedd5", stroke: "#ea580c", text: "#431407", dot: "#f97316" },
  retusche:   { fill: "#dcfce7", stroke: "#16a34a", text: "#052e16", dot: "#22c55e" },
};

// ── Per-service SVG colors (dark background – interactive car diagram) ────
const SERVICE_SVG_COLORS: Record<ServiceKey, { fill: string; stroke: string; dot: string; text: string }> = {
  polieren:   { fill: "#78350f", stroke: "#fbbf24", dot: "#fbbf24", text: "#fef3c7" },
  lackieren:  { fill: "#7f1d1d", stroke: "#f87171", dot: "#ef4444", text: "#fca5a5" },
  komplett:   { fill: "#500724", stroke: "#f472b6", dot: "#ec4899", text: "#fbcfe8" },
  inst_lack:  { fill: "#2e1065", stroke: "#a78bfa", dot: "#8b5cf6", text: "#e9d5ff" },
  ausbeulen:  { fill: "#431407", stroke: "#fb923c", dot: "#f97316", text: "#fed7aa" },
  retusche:   { fill: "#052e16", stroke: "#4ade80", dot: "#22c55e", text: "#bbf7d0" },
};

// ── Panel label translations ──────────────────────────────────────────────
const PANEL_I18N: Record<string, Record<Lang, string>> = {
  "fb-l":     { de: "Stoßstange vorne li.",  ro: "Bara față stânga",    es: "Parachoques del. izq." },
  "hl-l":     { de: "Scheinwerfer li.",       ro: "Far stânga",          es: "Faro izq." },
  "fen-f-l":  { de: "Kotflügel vorne li.",   ro: "Aripa față stânga",   es: "Aleta delantera izq." },
  "hood-l":   { de: "Motorhaube li.",         ro: "Capotă stânga",       es: "Capó izq." },
  "mir-l":    { de: "Spiegel li.",            ro: "Oglindă stânga",      es: "Espejo izq." },
  "ws-l":     { de: "Windschutzscheibe",      ro: "Parbriz",             es: "Parabrisas" },
  "fd-l":     { de: "Tür vorne li.",          ro: "Ușă față stânga",     es: "Puerta del. izq." },
  "roof-l":   { de: "Dach li.",               ro: "Plafon stânga",       es: "Techo izq." },
  "rd-l":     { de: "Tür hinten li.",         ro: "Ușă spate stânga",    es: "Puerta tras. izq." },
  "sill-l":   { de: "Schweller li.",          ro: "Prag stânga",         es: "Umbral izq." },
  "qt-l":     { de: "Seitenteil hinten li.", ro: "Aripă spate stânga",  es: "Panel trasero izq." },
  "rw-l":     { de: "Heckscheibe",            ro: "Luneta",              es: "Luneta trasera" },
  "trunk-l":  { de: "Heckklappe li.",         ro: "Hayon stânga",        es: "Portón izq." },
  "tl-l":     { de: "Rücklicht li.",          ro: "Stop stânga",         es: "Piloto trasero izq." },
  "rb-l":     { de: "Stoßstange hinten li.", ro: "Bara spate stânga",   es: "Parachoques tras. izq." },
  "fb-r":     { de: "Stoßstange vorne re.",  ro: "Bara față dreapta",   es: "Parachoques del. der." },
  "hl-r":     { de: "Scheinwerfer re.",       ro: "Far dreapta",         es: "Faro der." },
  "fen-f-r":  { de: "Kotflügel vorne re.",   ro: "Aripa față dreapta",  es: "Aleta delantera der." },
  "hood-r":   { de: "Motorhaube re.",         ro: "Capotă dreapta",      es: "Capó der." },
  "mir-r":    { de: "Spiegel re.",            ro: "Oglindă dreapta",     es: "Espejo der." },
  "ws-r":     { de: "Windschutzscheibe",      ro: "Parbriz",             es: "Parabrisas" },
  "fd-r":     { de: "Tür vorne re.",          ro: "Ușă față dreapta",    es: "Puerta del. der." },
  "roof-r":   { de: "Dach re.",               ro: "Plafon dreapta",      es: "Techo der." },
  "rd-r":     { de: "Tür hinten re.",         ro: "Ușă spate dreapta",   es: "Puerta tras. der." },
  "sill-r":   { de: "Schweller re.",          ro: "Prag dreapta",        es: "Umbral der." },
  "qt-r":     { de: "Seitenteil hinten re.", ro: "Aripă spate dreapta", es: "Panel trasero der." },
  "rw-r":     { de: "Heckscheibe",            ro: "Luneta",              es: "Luneta trasera" },
  "trunk-r":  { de: "Heckklappe re.",         ro: "Hayon dreapta",       es: "Portón der." },
  "tl-r":     { de: "Rücklicht re.",          ro: "Stop dreapta",        es: "Piloto trasero der." },
  "rb-r":     { de: "Stoßstange hinten re.", ro: "Bara spate dreapta",  es: "Parachoques tras. der." },
  "fb-top-l": { de: "Stoßst. vorne li.",     ro: "Bară față st.",       es: "Parachoq. del. izq." },
  "fb-top-c": { de: "Stoßst. vorne Mi.",     ro: "Bară față mij.",      es: "Parachoq. del. cen." },
  "fb-top-r": { de: "Stoßst. vorne re.",     ro: "Bară față dr.",       es: "Parachoq. del. der." },
  "hood-l-t": { de: "Motorhaube li.",         ro: "Capotă st.",          es: "Capó izq." },
  "hood-c-t": { de: "Motorhaube Mi.",         ro: "Capotă mij.",         es: "Capó cen." },
  "hood-r-t": { de: "Motorhaube re.",         ro: "Capotă dr.",          es: "Capó der." },
  "ws-top":   { de: "Windschutzscheibe",      ro: "Parbriz",             es: "Parabrisas" },
  "roof-l-t": { de: "Dach li.",               ro: "Plafon st.",          es: "Techo izq." },
  "roof-c-t": { de: "Dach Mi.",               ro: "Plafon mij.",         es: "Techo cen." },
  "roof-r-t": { de: "Dach re.",               ro: "Plafon dr.",          es: "Techo der." },
  "rw-top":   { de: "Heckscheibe",            ro: "Luneta",              es: "Luneta trasera" },
  "trunk-l-t":{ de: "Heckklappe li.",         ro: "Hayon st.",           es: "Portón izq." },
  "trunk-c-t":{ de: "Heckklappe Mi.",         ro: "Hayon mij.",          es: "Portón cen." },
  "trunk-r-t":{ de: "Heckklappe re.",         ro: "Hayon dr.",           es: "Portón der." },
  "rb-top-l": { de: "Stoßst. hi. li.",        ro: "Bară spate st.",      es: "Parachoq. tras. izq." },
  "rb-top-c": { de: "Stoßst. hi. Mi.",        ro: "Bară spate mij.",     es: "Parachoq. tras. cen." },
  "rb-top-r": { de: "Stoßst. hi. re.",        ro: "Bară spate dr.",      es: "Parachoq. tras. der." },
};

function getPanelLabel(panelId: string, lang: Lang): string {
  return PANEL_I18N[panelId]?.[lang] ?? PANEL_I18N[panelId]?.de ?? panelId;
}

// ── Car panels (same as before) ─────────────────────────────────────────────
interface CarPanel {
  id: string; label: string; shortLabel: string;
  x: number; y: number; w: number; h: number; rx?: number;
  view: "left" | "top" | "right"; noZones?: boolean;
}

const LEFT_PANELS: CarPanel[] = [
  { id: "fb-l",    label: "Stoßstange vorne links",     shortLabel: "St.v.",  x: 8,   y: 152, w: 82,  h: 76, rx: 4, view: "left" },
  { id: "hl-l",    label: "Scheinwerfer links",          shortLabel: "SW",     x: 10,  y: 96,  w: 68,  h: 58, rx: 3, view: "left" },
  { id: "fen-f-l", label: "Kotflügel vorne links",       shortLabel: "KF v.",  x: 76,  y: 128, w: 122, h: 96, rx: 3, view: "left" },
  { id: "hood-l",  label: "Motorhaube links",            shortLabel: "MH li",  x: 76,  y: 78,  w: 188, h: 54, rx: 3, view: "left" },
  { id: "mir-l",   label: "Spiegel links",               shortLabel: "Sp.",    x: 214, y: 92,  w: 38,  h: 30, rx: 8, view: "left", noZones: true },
  { id: "ws-l",    label: "Windschutzscheibe",           shortLabel: "WSS",    x: 262, y: 70,  w: 112, h: 65, rx: 3, view: "left" },
  { id: "fd-l",    label: "Tür vorne links",             shortLabel: "TV",     x: 258, y: 110, w: 172, h: 100, rx: 3, view: "left" },
  { id: "roof-l",  label: "Dach links",                  shortLabel: "Da",     x: 372, y: 60,  w: 218, h: 52, rx: 3, view: "left" },
  { id: "rd-l",    label: "Tür hinten links",            shortLabel: "TH",     x: 428, y: 110, w: 160, h: 100, rx: 3, view: "left" },
  { id: "sill-l",  label: "Schweller links",             shortLabel: "Sw.",    x: 258, y: 210, w: 328, h: 18, rx: 2, view: "left", noZones: true },
  { id: "qt-l",    label: "Seitenteil hinten links",     shortLabel: "ST",     x: 586, y: 110, w: 130, h: 100, rx: 3, view: "left" },
  { id: "rw-l",    label: "Heckscheibe",                 shortLabel: "HS",     x: 586, y: 62,  w: 118, h: 52, rx: 3, view: "left" },
  { id: "trunk-l", label: "Heckklappe links",            shortLabel: "HK",     x: 640, y: 110, w: 92,  h: 58, rx: 3, view: "left" },
  { id: "tl-l",    label: "Rücklicht links",             shortLabel: "RL",     x: 700, y: 94,  w: 70,  h: 60, rx: 3, view: "left" },
  { id: "rb-l",    label: "Stoßstange hinten links",     shortLabel: "St.h.",  x: 702, y: 150, w: 82,  h: 78, rx: 4, view: "left" },
];

const W = 760;
const RIGHT_PANELS: CarPanel[] = LEFT_PANELS.map((p) => ({
  ...p, id: p.id.replace(/-l$/, "-r"), label: p.label.replace("links", "rechts").replace(" li", " re"),
  x: W - p.x - p.w, view: "right" as const,
}));

const TOP_PANELS: CarPanel[] = [
  { id: "fb-top-l", label: "Stoßstange vorne links",   shortLabel: "St.v.li", x: 42,  y: 14,  w: 88,  h: 54,  rx: 4, view: "top", noZones: true },
  { id: "fb-top-c", label: "Stoßstange vorne Mitte",   shortLabel: "St.v.Mi", x: 130, y: 8,   w: 102, h: 60,  rx: 4, view: "top", noZones: true },
  { id: "fb-top-r", label: "Stoßstange vorne rechts",  shortLabel: "St.v.re", x: 232, y: 14,  w: 88,  h: 54,  rx: 4, view: "top", noZones: true },
  { id: "hood-l-t", label: "Motorhaube links",          shortLabel: "MH li",  x: 42,  y: 68,  w: 88,  h: 158, rx: 3, view: "top" },
  { id: "hood-c-t", label: "Motorhaube Mitte",          shortLabel: "MH Mi",  x: 130, y: 68,  w: 102, h: 158, rx: 3, view: "top" },
  { id: "hood-r-t", label: "Motorhaube rechts",         shortLabel: "MH re",  x: 232, y: 68,  w: 88,  h: 158, rx: 3, view: "top" },
  { id: "ws-top",   label: "Windschutzscheibe",         shortLabel: "WSS",    x: 42,  y: 226, w: 278, h: 70,  rx: 3, view: "top", noZones: true },
  { id: "roof-l-t", label: "Dach links",                shortLabel: "Da li",  x: 42,  y: 296, w: 88,  h: 172, rx: 3, view: "top" },
  { id: "roof-c-t", label: "Dach Mitte",                shortLabel: "Da Mi",  x: 130, y: 296, w: 102, h: 172, rx: 3, view: "top" },
  { id: "roof-r-t", label: "Dach rechts",               shortLabel: "Da re",  x: 232, y: 296, w: 88,  h: 172, rx: 3, view: "top" },
  { id: "rw-top",   label: "Heckscheibe",               shortLabel: "HS",     x: 42,  y: 468, w: 278, h: 68,  rx: 3, view: "top", noZones: true },
  { id: "trunk-l-t",label: "Heckklappe links",          shortLabel: "HK li",  x: 42,  y: 536, w: 88,  h: 134, rx: 3, view: "top" },
  { id: "trunk-c-t",label: "Heckklappe Mitte",          shortLabel: "HK Mi",  x: 130, y: 536, w: 102, h: 134, rx: 3, view: "top" },
  { id: "trunk-r-t",label: "Heckklappe rechts",         shortLabel: "HK re",  x: 232, y: 536, w: 88,  h: 134, rx: 3, view: "top" },
  { id: "rb-top-l", label: "Stoßstange hinten links",   shortLabel: "St.h.li",x: 42,  y: 670, w: 88,  h: 52,  rx: 4, view: "top", noZones: true },
  { id: "rb-top-c", label: "Stoßstange hinten Mitte",   shortLabel: "St.h.Mi",x: 130, y: 676, w: 102, h: 46,  rx: 4, view: "top", noZones: true },
  { id: "rb-top-r", label: "Stoßstange hinten rechts",  shortLabel: "St.h.re",x: 232, y: 670, w: 88,  h: 52,  rx: 4, view: "top", noZones: true },
];

const ALL_PANELS = [...LEFT_PANELS, ...TOP_PANELS, ...RIGHT_PANELS];

const SEDAN_LEFT_PATH = "M 12,228 Q 8,228 8,212 L 8,170 Q 8,148 28,145 L 78,128 Q 88,74 130,68 L 258,58 L 268,44 Q 282,36 308,34 L 390,34 Q 440,34 455,42 L 578,42 Q 606,44 624,60 L 668,84 Q 698,108 710,145 L 722,155 Q 740,157 742,175 L 742,228 Q 680,228 668,228 Q 616,228 616,228 Q 568,228 534,228 Q 522,228 522,228 Q 240,228 230,228 Q 196,228 162,228 Q 110,228 90,228 Q 68,228 48,228 Z";

// ── Types ───────────────────────────────────────────────────────────────────
interface RepairEntry {
  id: string; panelId: string; panelLabel: string;
  view: string; zone: string;
  service: ServiceKey; priceNet: string;
}

interface CustomerInfo {
  name: string; abNummer: string; phone: string; email: string; address: string;
  vehicle: string; model: string; plate: string; vin: string; color: string; mileage: string;
  leihwagen: boolean; abBring: boolean;
}

interface PopupState { panel: CarPanel; x: number; y: number; containerH: number; }
interface PhotoItem { id: string; name: string; dataUrl: string; }

const emptyCustomer: CustomerInfo = {
  name: "", abNummer: "", phone: "", email: "", address: "",
  vehicle: "", model: "", plate: "", vin: "", color: "", mileage: "",
  leihwagen: false, abBring: false,
};

// ── Zone dashes ─────────────────────────────────────────────────────────────
function ZoneDashes({ p }: { p: CarPanel }) {
  if (p.noZones || p.h < 50) return null;
  const t = p.h / 3;
  return <>
    <line x1={p.x+4} y1={p.y+t}   x2={p.x+p.w-4} y2={p.y+t}   stroke="#4b5563" strokeWidth="1" strokeDasharray="4 3"/>
    <line x1={p.x+4} y1={p.y+t*2} x2={p.x+p.w-4} y2={p.y+t*2} stroke="#4b5563" strokeWidth="1" strokeDasharray="4 3"/>
  </>;
}

// ── Print Car SVG (white background, color-coded per service) ───────────────
function PrintCarSVG({ repairs, view }: { repairs: RepairEntry[]; view: "left" | "top" | "right" }) {
  const panels = ALL_PANELS.filter((p) => p.view === view);
  const repMap = new Map(repairs.filter(r => r.view === view).map(r => [r.panelId, r.service as ServiceKey]));
  const isSide = view !== "top";

  function getColors(p: CarPanel) {
    const svc = repMap.get(p.id);
    if (!svc) return { fill: "#f1f5f9", stroke: "#cbd5e1", text: "#64748b" };
    const c = SERVICE_PRINT_COLORS[svc];
    return { fill: c.fill, stroke: c.stroke, text: c.text };
  }

  if (isSide) return (
    <svg viewBox="0 0 760 252" style={{ width: "100%", display: "block" }}>
      <rect width="760" height="252" fill="#f8fafc" />
      <path d={SEDAN_LEFT_PATH} fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5"
        transform={view === "right" ? "scale(-1,1) translate(-760,0)" : undefined} />
      <circle cx={view==="right"?568:192} cy="228" r="46" fill="white" stroke="#94a3b8" strokeWidth="1.5"/>
      <circle cx={view==="right"?184:576} cy="228" r="46" fill="white" stroke="#94a3b8" strokeWidth="1.5"/>
      {panels.map(p => {
        const c = getColors(p);
        const isRep = repMap.has(p.id);
        return (
          <g key={p.id}>
            <rect x={p.x} y={p.y} width={p.w} height={p.h} rx={p.rx??3}
              fill={c.fill} stroke={c.stroke} strokeWidth={isRep?2:1} />
            {isRep && !p.noZones && p.h>=50 && <>
              <line x1={p.x+2} y1={p.y+p.h/3}   x2={p.x+p.w-2} y2={p.y+p.h/3}   stroke={c.stroke} strokeWidth="0.7" strokeDasharray="3 2"/>
              <line x1={p.x+2} y1={p.y+p.h*2/3} x2={p.x+p.w-2} y2={p.y+p.h*2/3} stroke={c.stroke} strokeWidth="0.7" strokeDasharray="3 2"/>
            </>}
            <text x={p.x+p.w/2} y={p.y+p.h/2+4} textAnchor="middle"
              fill={c.text} fontSize={p.shortLabel.length>6?"6":"7"} fontWeight={isRep?"700":"400"} pointerEvents="none">
              {p.shortLabel}
            </text>
          </g>
        );
      })}
    </svg>
  );
  return (
    <svg viewBox="0 0 362 732" style={{ width: "160px", display: "block", margin: "0 auto" }}>
      <rect width="362" height="732" fill="#f8fafc"/>
      <rect x="36" y="8" width="290" height="716" rx="18" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5"/>
      {panels.map(p => {
        const c = getColors(p);
        const isRep = repMap.has(p.id);
        return (
          <g key={p.id}>
            <rect x={p.x} y={p.y} width={p.w} height={p.h} rx={p.rx??3}
              fill={c.fill} stroke={c.stroke} strokeWidth={isRep?2:1}/>
            <text x={p.x+p.w/2} y={p.y+p.h/2+3} textAnchor="middle"
              fill={c.text} fontSize="6" fontWeight={isRep?"700":"400"} pointerEvents="none">
              {p.shortLabel}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Print legend (service → color) ───────────────────────────────────────────
function PrintLegend({ repairs, lang }: { repairs: RepairEntry[]; lang: Lang }) {
  const usedServices = Array.from(new Set(repairs.map(r => r.service as ServiceKey)));
  if (usedServices.length === 0) return null;
  const tl = T[lang];
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "10px", padding: "8px 12px" }}>
      {usedServices.map(svc => {
        const c = SERVICE_PRINT_COLORS[svc as ServiceKey];
        if (!c) return null;
        const name = tl.services[svc as ServiceKey];
        return (
          <span key={svc} style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "2px 8px", borderRadius: "12px", border: `1px solid ${c.stroke}`, background: c.fill, fontSize: "10px", fontWeight: "600", color: c.text }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: c.dot, display: "inline-block" }}/>
            {name}
          </span>
        );
      })}
    </div>
  );
}

// ── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function RepairOrderForm() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const kfzInputRef = useRef<HTMLInputElement>(null);

  const [lang, setLang] = useState<Lang>("de");
  const t = T[lang];

  const [customer, setCustomer] = useState<CustomerInfo>(emptyCustomer);
  const [repairs, setRepairs] = useState<RepairEntry[]>([]);
  const [partnerId, setPartnerId] = useState("");
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [popup, setPopup] = useState<PopupState | null>(null);
  const [pendingZone, setPendingZone] = useState("all");
  const [pendingService, setPendingService] = useState<ServiceKey>("lackieren");
  const [pendingPrice, setPendingPrice] = useState("");
  const [activeView, setActiveView] = useState<"left" | "top" | "right">("left");
  const [activeTool, setActiveTool] = useState<ServiceKey | "eraser">("lackieren");
  const [hoveredPanel, setHoveredPanel] = useState<string | null>(null);
  const [kfzLoading, setKfzLoading] = useState(false);
  const [emailDlgOpen, setEmailDlgOpen] = useState(false);
  const [emailTo, setEmailTo] = useState("");
  const [emailMode, setEmailMode] = useState<"partner"|"client"|"admin">("client");
  const [emailSending, setEmailSending] = useState(false);
  const [waDlgOpen, setWaDlgOpen] = useState(false);
  const [waMode, setWaMode] = useState<"partner"|"client"|"admin">("partner");

  const { data: allUsers = [] } = useQuery<UserType[]>({ queryKey: ["/api/users"] });
  const partners = allUsers.filter((u) => u.role === "partner");
  const assignedPartner = partners.find((p) => p.id === partnerId);

  // ── VAT ──────────────────────────────────────────────────────────────────
  const totalNet = repairs.reduce((s, r) => s + (parseFloat(r.priceNet) || 0), 0);
  const vatAmt = totalNet * 0.19;
  const totalGross = totalNet + vatAmt + (customer.abBring ? 59 : 0) + (customer.leihwagen ? 39 : 0);

  // ── CRM save ─────────────────────────────────────────────────────────────
  // Creates the order, then — if damage photos were captured in this form —
  // uploads them via the order's attachment endpoint. Without this second step
  // the photos only ever existed as in-memory dataUrls and were silently lost
  // on save (never reached file_attachments, Drive, or the partner gallery).
  const saveMutation = useMutation({
    mutationFn: async () => {
      const repairSummary = repairs.map(r => `${getPanelLabel(r.panelId, lang)} [${r.zone}] → ${t.services[r.service as ServiceKey]}: ${r.priceNet}€`).join("\n");
      const res = await apiRequest("POST", "/api/admin/workshop-orders", {
        orderDate: new Date().toISOString(),
        customerName: customer.name || "Unbekannt",
        customerAddress: customer.address || undefined,
        customerPhone: customer.phone || undefined,
        customerEmail: customer.email || undefined,
        vehicleMake: customer.vehicle || undefined,
        vehicleModel: customer.model || undefined,
        vehiclePlate: customer.plate || undefined,
        vehicleVin: customer.vin || undefined,
        vehicleColor: customer.color || undefined,
        vehicleMileage: customer.mileage || undefined,
        damageDescription: repairSummary || "Reparaturprotokoll",
        partnerId: partnerId || undefined,
        totalAmountCents: Math.round(totalGross * 100),
        status: "open", paymentStatus: "offen", paidAmountCents: 0,
      });
      const order = await res.json();

      let attachmentsFailed = false;
      if (photos.length > 0 && order?.id) {
        try {
          const files = photos.map((ph) => {
            const [, base64 = ""] = ph.dataUrl.split(",");
            const mimeMatch = ph.dataUrl.match(/^data:([^;]+);/);
            return { name: ph.name, type: mimeMatch?.[1] || "image/jpeg", data: base64 };
          });
          await apiRequest("POST", `/api/admin/workshop-orders/${order.id}/attachments`, { files });
        } catch (err) {
          attachmentsFailed = true;
          console.error("Photo attachment upload failed:", err);
        }
      }

      return { order, attachmentsFailed };
    },
    onSuccess: ({ attachmentsFailed }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/workshop-orders"] });
      if (attachmentsFailed) {
        toast({ title: "Auftrag gespeichert", description: "Fotos konnten nicht hochgeladen werden — bitte erneut versuchen.", variant: "destructive" });
      } else {
        setPhotos([]);
        toast({ title: "Gespeichert", description: "Auftrag wurde im CRM gespeichert." });
      }
    },
    onError: () => toast({ title: "Fehler", description: "Speichern fehlgeschlagen.", variant: "destructive" }),
  });

  // ── KFZ OCR ──────────────────────────────────────────────────────────────
  async function handleKfzScan(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setKfzLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        try {
          const dataUrl = ev.target?.result as string;
          const base64 = dataUrl.split(",")[1];
          const mimeType = file.type || "image/jpeg";
          const res = await fetch("/api/ai/extract-vehicle-registration", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ imageBase64: base64, mimeType }),
          });
          if (!res.ok) {
            const msg = await res.text();
            throw new Error(`${res.status}: ${msg}`);
          }
          const json = await res.json();
          if (json.success && json.data) {
            const d = json.data;
            setCustomer((prev) => ({
              ...prev,
              vehicle: d.vehicleMake || prev.vehicle,
              model: d.vehicleModel || prev.model,
              plate: d.vehiclePlate || prev.plate,
              vin: d.vehicleVin || prev.vin,
              color: d.vehicleColor || prev.color,
              mileage: d.vehicleYear ? `Bj. ${d.vehicleYear}` : prev.mileage,
              name: d.customerName || prev.name,
              address: d.customerAddress || prev.address,
            }));
            toast({ title: "KI-Extraktion erfolgreich", description: "Fahrzeugdaten wurden automatisch eingetragen." });
          } else {
            toast({ title: "KI konnte keine Daten extrahieren", description: "Bitte manuell eintragen.", variant: "destructive" });
          }
        } catch (err: any) {
          toast({ title: "Fehler bei der Extraktion", description: err?.message || "Unbekannter Fehler.", variant: "destructive" });
        } finally {
          setKfzLoading(false);
        }
      };
      reader.onerror = () => { setKfzLoading(false); toast({ title: "Fehler", description: "Datei konnte nicht gelesen werden.", variant: "destructive" }); };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setKfzLoading(false);
      toast({ title: "Fehler", description: err?.message || "KI-Extraktion fehlgeschlagen.", variant: "destructive" });
    }
  }

  // ── Panel click ───────────────────────────────────────────────────────────
  const handlePanelClick = useCallback((panel: CarPanel, evt: React.MouseEvent<SVGElement>) => {
    evt.stopPropagation();
    const svgEl = (evt.currentTarget as SVGElement).closest("svg");
    const svgRect = svgEl?.getBoundingClientRect();
    if (!svgRect) return;
    if (activeTool === "eraser") {
      setRepairs((p) => p.filter((r) => r.panelId !== panel.id));
      return;
    }
    const existing = repairs.find((r) => r.panelId === panel.id);
    setPendingZone(existing?.zone ?? "all");
    setPendingService(activeTool);
    setPendingPrice(existing?.priceNet ?? "");
    setPopup({ panel, x: evt.clientX - svgRect.left, y: evt.clientY - svgRect.top, containerH: svgRect.height });
  }, [repairs, activeTool]);

  function confirmRepair() {
    if (!popup) return;
    setRepairs((prev) => {
      const idx = prev.findIndex((r) => r.panelId === popup.panel.id);
      const entry: RepairEntry = {
        id: popup.panel.id + "_" + Date.now(),
        panelId: popup.panel.id, panelLabel: popup.panel.label,
        view: popup.panel.view, zone: pendingZone,
        service: pendingService, priceNet: pendingPrice,
      };
      if (idx >= 0) { const n = [...prev]; n[idx] = entry; return n; }
      return [...prev, entry];
    });
    setPopup(null);
  }

  function removeRepair(panelId: string) { setRepairs((p) => p.filter((r) => r.panelId !== panelId)); }

  // ── Photo handling ────────────────────────────────────────────────────────
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    Array.from(e.target.files ?? []).forEach((f) => {
      const reader = new FileReader();
      reader.onload = (ev) => setPhotos((p) => [...p, { id: crypto.randomUUID(), name: f.name, dataUrl: ev.target?.result as string }]);
      reader.readAsDataURL(f);
    });
    e.target.value = "";
  }

  // ── WhatsApp share ────────────────────────────────────────────────────────
  function openWhatsAppDialog() { setWaDlgOpen(true); }

  function doShareWhatsApp(mode: "partner"|"client"|"admin") {
    const showCustomer = mode !== "partner";
    const showPrices = mode !== "partner";
    const header = mode === "partner"
      ? `Werkstattauftrag – Corion Lackdoktor`
      : mode === "client"
      ? `Auftragsbestätigung – Corion Lackdoktor`
      : `Vollständiger Auftrag – Corion Lackdoktor`;

    const lines = [
      header,
      `${customer.vehicle} ${customer.model} | ${customer.plate} | ${customer.color}`,
      customer.vin ? `FIN: ${customer.vin}` : "",
      showCustomer && customer.name ? `Kunde: ${customer.name}` : "",
      showCustomer && customer.phone ? `Tel: ${customer.phone}` : "",
      ``,
      `LEISTUNGEN:`,
      ...repairs.map((r, i) => {
        const label = getPanelLabel(r.panelId, lang);
        const svcName = t.services[r.service as ServiceKey];
        const price = showPrices && r.priceNet ? ` – ${parseFloat(r.priceNet).toFixed(2)} €` : "";
        return `${i+1}. ${label} [${zoneLabel(r.zone)}] → ${svcName}${price}`;
      }),
      ``,
      showPrices ? `Netto: ${totalNet.toFixed(2)} € | MwSt. 19%: ${vatAmt.toFixed(2)} € | Gesamt: ${totalGross.toFixed(2)} €` : "",
      assignedPartner && mode === "admin" ? `Partner: ${assignedPartner.firstName} ${assignedPartner.lastName}` : "",
      ``,
      `+1 Corion Lackdoktor · 0176 83 45 82 74`,
    ].filter(Boolean).join("\n");
    window.open("https://wa.me/?text=" + encodeURIComponent(lines), "_blank");
    setWaDlgOpen(false);
  }

  // ── Email share ───────────────────────────────────────────────────────────
  async function sendEmail() {
    if (!emailTo) return;
    setEmailSending(true);
    const html = buildEmailHtml(emailMode);
    try {
      await apiRequest("POST", "/api/repair-order/send-email", {
        to: emailTo, mode: emailMode, htmlContent: html,
        subject: `Reparaturauftrag – ${customer.vehicle} ${customer.plate} – Corion Lackdoktor`,
      });
      toast({ title: "E-Mail gesendet", description: `Auftrag wurde an ${emailTo} gesendet.` });
      setEmailDlgOpen(false);
    } catch {
      toast({ title: "Fehler", description: "E-Mail konnte nicht gesendet werden.", variant: "destructive" });
    } finally {
      setEmailSending(false);
    }
  }

  function buildEmailHtml(mode: "partner"|"client"|"admin") {
    const rows = repairs.map((r, i) => `
      <tr style="border-bottom:1px solid #eee">
        <td style="padding:6px 8px">${i+1}</td>
        <td style="padding:6px 8px">${getPanelLabel(r.panelId, lang)}</td>
        <td style="padding:6px 8px">${zoneLabel(r.zone)}</td>
        <td style="padding:6px 8px"><strong>${t.services[r.service]}</strong></td>
        ${mode !== "partner" ? `<td style="padding:6px 8px;text-align:right">${r.priceNet ? parseFloat(r.priceNet).toFixed(2)+" €" : "–"}</td>` : ""}
      </tr>`).join("");

    const customerBlock = mode !== "partner" ? `
      <h3 style="color:#b91c1c">Kundendaten</h3>
      <p>${customer.name} · ${customer.phone} · ${customer.email}</p>
      <p>${customer.address}</p>` : "";

    const priceBlock = mode !== "partner" ? `
      <hr/><p>Netto: <strong>${totalNet.toFixed(2)} €</strong></p>
      <p>MwSt. 19%: <strong>${vatAmt.toFixed(2)} €</strong></p>
      <p><strong>Gesamt: ${totalGross.toFixed(2)} €</strong></p>` : "";

    return `<!DOCTYPE html><html><body style="font-family:sans-serif;color:#111;max-width:700px;margin:0 auto">
      <div style="background:#b91c1c;color:white;padding:16px 24px">
        <h2 style="margin:0">Corion Lackdoktor – Reparaturauftrag</h2>
        <p style="margin:4px 0 0;opacity:0.85">${mode==="partner"?"Partnerauftrag":mode==="client"?"Auftragsbestätigung":"Vollständiger Auftrag"}</p>
      </div>
      <div style="padding:20px">
        ${customerBlock}
        <h3 style="color:#b91c1c">Fahrzeugdaten</h3>
        <p>${customer.vehicle} ${customer.model} · ${customer.plate} · ${customer.color} · ${customer.vin}</p>
        <h3 style="color:#b91c1c">Leistungen</h3>
        <table style="width:100%;border-collapse:collapse;font-size:13px">
          <tr style="background:#f1f5f9"><th>Nr.</th><th>Teil</th><th>Zone</th><th>Leistung</th>${mode!=="partner"?"<th>Preis</th>":""}</tr>
          ${rows}
        </table>
        ${priceBlock}
        <hr/><p style="font-size:12px;color:#666">+1 Corion Lackdoktor GmbH · Nassaustraße 41, 65719 Hofheim · 0176 83 45 82 74</p>
      </div></body></html>`;
  }

  // ── Print ─────────────────────────────────────────────────────────────────
  function doPrint(mode: "admin"|"partner"|"client") {
    document.body.setAttribute("data-print-mode", mode);
    window.print();
    setTimeout(() => document.body.removeAttribute("data-print-mode"), 1000);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  const repairedIds = new Set(repairs.map((r) => r.panelId));
  const repairsServiceMap = new Map(repairs.map((r) => [r.panelId, r.service as ServiceKey]));

  function zoneLabel(z: string) {
    if (z==="all") return t.zoneAll; if (z==="top") return t.zoneTop;
    if (z==="middle") return t.zoneMid; if (z==="bottom") return t.zoneBot;
    return z;
  }

  function panelSvcColors(p: CarPanel) {
    const svc = repairsServiceMap.get(p.id);
    return svc ? SERVICE_SVG_COLORS[svc] : null;
  }
  function panelFill(p: CarPanel) {
    const c = panelSvcColors(p);
    return c ? c.fill : "#1e293b";
  }
  function panelStroke(p: CarPanel) {
    if (popup?.panel.id === p.id) return "#f59e0b";
    const c = panelSvcColors(p);
    return c ? c.stroke : "#334155";
  }
  function panelOpacity(p: CarPanel) { return repairedIds.has(p.id) ? 0.85 : 0.45; }

  const viewPanels = ALL_PANELS.filter((p) => p.view === activeView);
  const isSide = activeView !== "top";
  const setCustomerField = (k: keyof CustomerInfo, v: string | boolean) => setCustomer((prev) => ({ ...prev, [k]: v }));

  function PanelRect({ p }: { p: CarPanel }) {
    const svcColors = panelSvcColors(p);
    const isHovered = hoveredPanel === p.id;
    const isPopupOpen = popup?.panel.id === p.id;
    const toolColors = activeTool !== "eraser" ? SERVICE_SVG_COLORS[activeTool] : null;
    let fillColor = svcColors ? svcColors.fill : "#1e293b";
    let strokeColor = isPopupOpen ? "#f59e0b" : svcColors ? svcColors.stroke : "#334155";
    if (isHovered && !svcColors && toolColors) {
      fillColor = toolColors.fill + "66";
      strokeColor = toolColors.stroke;
    } else if (isHovered && !svcColors) {
      fillColor = "#2d3f55";
      strokeColor = "#64748b";
    } else if (isHovered && svcColors) {
      strokeColor = "#f59e0b";
    }
    const opacity = svcColors ? 0.88 : isHovered ? 0.7 : 0.45;
    return (
      <g style={{ cursor: activeTool === "eraser" ? "cell" : "crosshair" }}
        onClick={(e) => handlePanelClick(p, e)}
        onMouseEnter={() => setHoveredPanel(p.id)}
        onMouseLeave={() => setHoveredPanel(null)}>
        <rect x={p.x} y={p.y} width={p.w} height={p.h} rx={p.rx??3}
          fill={fillColor} stroke={strokeColor}
          strokeWidth={isPopupOpen ? 2.5 : svcColors || isHovered ? 1.5 : 1} opacity={opacity}/>
        {svcColors && <rect x={p.x} y={p.y} width={p.w} height={p.h} rx={p.rx??3}
          fill={`url(#gloss-${p.id})`} opacity={0.25} pointerEvents="none"/>}
        <ZoneDashes p={p}/>
        {svcColors && <circle cx={p.x+p.w-7} cy={p.y+7} r={5} fill={svcColors.dot} stroke="rgba(255,255,255,0.35)" strokeWidth="1.5"/>}
        {isHovered && !svcColors && toolColors && (
          <circle cx={p.x+p.w-7} cy={p.y+7} r={4} fill={toolColors.dot} stroke="rgba(255,255,255,0.2)" strokeWidth="1" opacity={0.6}/>
        )}
        <text x={p.x+p.w/2} y={p.y+p.h/2+(p.h<30?3:4)} textAnchor="middle"
          fill={svcColors ? svcColors.text : isHovered ? "#e2e8f0" : "#94a3b8"}
          fontSize={p.shortLabel.length>6?"7":"8"} fontWeight={svcColors?"600":"500"} pointerEvents="none">
          {p.shortLabel}
        </text>
      </g>
    );
  }

  const orderDate = new Date().toLocaleDateString("de-DE");

  return (
    <>
      <SEO title="Reparaturprotokoll | Lackdoktor" description="Interaktives Fahrzeug-Reparaturprotokoll"/>

      {/* ── Print styles for 3 modes ── */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #print-admin, #print-admin * { visibility: visible !important; }
          #print-admin { position: fixed !important; inset: 0 !important; z-index: 9999 !important; background: white !important; overflow: auto !important; }
          body[data-print-mode="partner"] #print-admin { display: none !important; }
          body[data-print-mode="partner"] #print-partner { display: block !important; position: fixed !important; inset: 0 !important; z-index: 9999 !important; background: white !important; }
          body[data-print-mode="partner"] #print-partner * { visibility: visible !important; }
          body[data-print-mode="client"] #print-admin { display: none !important; }
          body[data-print-mode="client"] #print-client { display: block !important; position: fixed !important; inset: 0 !important; z-index: 9999 !important; background: white !important; }
          body[data-print-mode="client"] #print-client * { visibility: visible !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* ══ HIDDEN PRINT TEMPLATES ══════════════════════════════════════════ */}

      {/* PARTNER PRINT */}
      <div id="print-partner" style={{ display: "none", padding: "24px", fontFamily: "sans-serif", color: "#111", fontSize: "13px" }}>
        <div style={{ background: "#1e293b", color: "white", padding: "12px 20px", borderRadius: "6px", marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "16px", fontWeight: "bold" }}>Corion Lackdoktor – Werkstattauftrag</div>
            <div style={{ fontSize: "11px", opacity: 0.7 }}>{t.partnerPrintNote}</div>
          </div>
          <div style={{ textAlign: "right", fontSize: "11px", opacity: 0.8 }}>
            <div>Datum: {orderDate}</div>
            {customer.plate && <div style={{ fontSize: "14px", fontWeight: "bold", color: "white" }}>{customer.plate}</div>}
          </div>
        </div>

        {/* Vehicle only */}
        <div style={{ border: "1px solid #e2e8f0", borderRadius: "6px", padding: "12px", marginBottom: "14px" }}>
          <div style={{ fontWeight: "bold", fontSize: "12px", color: "#475569", marginBottom: "8px", textTransform: "uppercase" }}>Fahrzeugdaten</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px", fontSize: "13px" }}>
            <div><span style={{ color: "#64748b", fontSize: "10px" }}>MARKE/MODELL</span><br/><strong>{customer.vehicle} {customer.model}</strong></div>
            <div><span style={{ color: "#64748b", fontSize: "10px" }}>KENNZEICHEN</span><br/><strong>{customer.plate || "–"}</strong></div>
            <div><span style={{ color: "#64748b", fontSize: "10px" }}>FARBE</span><br/><strong>{customer.color || "–"}</strong></div>
            <div><span style={{ color: "#64748b", fontSize: "10px" }}>FIN/VIN</span><br/><strong style={{ fontSize: "11px" }}>{customer.vin || "–"}</strong></div>
            <div><span style={{ color: "#64748b", fontSize: "10px" }}>KM-STAND</span><br/><strong>{customer.mileage || "–"}</strong></div>
          </div>
        </div>

        {/* Car diagram row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: "8px", marginBottom: "14px", alignItems: "center" }}>
          <PrintCarSVG repairs={repairs} view="left"/>
          <PrintCarSVG repairs={repairs} view="top"/>
          <PrintCarSVG repairs={repairs} view="right"/>
        </div>

        {/* Works table – NO prices */}
        <div style={{ border: "1px solid #e2e8f0", borderRadius: "6px", overflow: "hidden", marginBottom: "14px" }}>
          <PrintLegend repairs={repairs} lang={lang}/>
          <div style={{ background: "#1e293b", color: "white", padding: "8px 14px", fontWeight: "bold", fontSize: "12px" }}>AUSZUFÜHRENDE ARBEITEN</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                <th style={{ padding: "6px 10px", textAlign: "left", color: "#475569" }}>Nr.</th>
                <th style={{ padding: "6px 10px", textAlign: "left", color: "#475569" }}>Bauteil</th>
                <th style={{ padding: "6px 10px", textAlign: "left", color: "#475569" }}>Zone</th>
                <th style={{ padding: "6px 10px", textAlign: "left", color: "#475569" }}>Leistung</th>
              </tr>
            </thead>
            <tbody>
              {repairs.map((r, i) => (
                <tr key={r.id} style={{ borderTop: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "7px 10px", color: "#64748b" }}>{i+1}</td>
                  <td style={{ padding: "7px 10px", fontWeight: "500" }}>{getPanelLabel(r.panelId, lang)}</td>
                  <td style={{ padding: "7px 10px", color: "#64748b" }}>{zoneLabel(r.zone)}</td>
                  <td style={{ padding: "7px 10px" }}><strong>{t.services[r.service]}</strong></td>
                </tr>
              ))}
              {repairs.length === 0 && <tr><td colSpan={4} style={{ padding: "16px", textAlign: "center", color: "#94a3b8" }}>Keine Leistungen ausgewählt</td></tr>}
            </tbody>
          </table>
        </div>

        {/* Photos */}
        {photos.length > 0 && (
          <div style={{ marginBottom: "14px" }}>
            <div style={{ fontWeight: "bold", fontSize: "12px", color: "#475569", marginBottom: "6px", textTransform: "uppercase" }}>Schadensfotos</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {photos.map((ph) => <img key={ph.id} src={ph.dataUrl} alt={ph.name} style={{ width: "120px", height: "90px", objectFit: "cover", borderRadius: "4px", border: "1px solid #e2e8f0" }}/>)}
            </div>
          </div>
        )}

        <div style={{ marginTop: "24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
          <div><div style={{ borderTop: "1px solid #000", paddingTop: "4px", fontSize: "10px", color: "#64748b" }}>Datum / Unterschrift Partner</div></div>
          <div><div style={{ borderTop: "1px solid #000", paddingTop: "4px", fontSize: "10px", color: "#64748b" }}>Unterschrift Lackdoktor</div></div>
        </div>
      </div>

      {/* CLIENT PRINT */}
      <div id="print-client" style={{ display: "none", padding: "24px", fontFamily: "sans-serif", color: "#111", fontSize: "13px" }}>
        <div style={{ background: "#b91c1c", color: "white", padding: "12px 20px", borderRadius: "6px", marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: "17px", fontWeight: "bold" }}>Auftragsbestätigung</div>
            <div style={{ fontSize: "11px", opacity: 0.8 }}>Corion Lackdoktor – Smart Repair</div>
          </div>
          <div style={{ textAlign: "right", fontSize: "11px" }}>
            <div style={{ fontWeight: "bold" }}>Lackdoktor - Hofheim Wallau</div>
            <div>Nassaustraße 41, 65719 Hofheim</div>
            <div>0176 83 45 82 74</div>
            <div style={{ marginTop: "4px" }}>Datum: {orderDate}</div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
          {/* Customer */}
          <div style={{ border: "1px solid #e2e8f0", borderRadius: "6px", padding: "12px" }}>
            <div style={{ fontWeight: "bold", fontSize: "11px", color: "#475569", marginBottom: "8px", textTransform: "uppercase" }}>Kundendaten</div>
            <div style={{ fontSize: "13px" }}><strong>{customer.name || "–"}</strong></div>
            <div style={{ color: "#64748b", fontSize: "12px" }}>{customer.address}</div>
            <div style={{ color: "#64748b", fontSize: "12px", marginTop: "4px" }}>{customer.phone} · {customer.email}</div>
            {customer.abNummer && <div style={{ marginTop: "4px", fontSize: "11px", color: "#475569" }}>AB/AG: {customer.abNummer}</div>}
          </div>
          {/* Vehicle */}
          <div style={{ border: "1px solid #e2e8f0", borderRadius: "6px", padding: "12px" }}>
            <div style={{ fontWeight: "bold", fontSize: "11px", color: "#475569", marginBottom: "8px", textTransform: "uppercase" }}>Fahrzeugdaten</div>
            <div><strong>{customer.vehicle} {customer.model}</strong></div>
            <div style={{ color: "#64748b", fontSize: "12px" }}>Kennzeichen: {customer.plate || "–"}</div>
            <div style={{ color: "#64748b", fontSize: "12px" }}>Farbe: {customer.color || "–"}</div>
            <div style={{ color: "#64748b", fontSize: "11px" }}>FIN: {customer.vin || "–"}</div>
            <div style={{ color: "#64748b", fontSize: "11px" }}>KM: {customer.mileage || "–"}</div>
          </div>
        </div>

        {/* Leistungen table WITH prices */}
        <div style={{ border: "1px solid #e2e8f0", borderRadius: "6px", overflow: "hidden", marginBottom: "14px" }}>
          <PrintLegend repairs={repairs} lang={lang}/>
          <div style={{ background: "#b91c1c", color: "white", padding: "8px 14px", fontWeight: "bold", fontSize: "12px" }}>LEISTUNGEN</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                <th style={{ padding: "6px 10px", textAlign: "left", color: "#475569" }}>Pos.</th>
                <th style={{ padding: "6px 10px", textAlign: "left", color: "#475569" }}>Bauteil</th>
                <th style={{ padding: "6px 10px", textAlign: "left", color: "#475569" }}>Zone</th>
                <th style={{ padding: "6px 10px", textAlign: "left", color: "#475569" }}>Leistung</th>
                <th style={{ padding: "6px 10px", textAlign: "right", color: "#475569" }}>Netto</th>
              </tr>
            </thead>
            <tbody>
              {repairs.map((r, i) => (
                <tr key={r.id} style={{ borderTop: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "7px 10px", color: "#64748b" }}>{i+1}</td>
                  <td style={{ padding: "7px 10px", fontWeight: "500" }}>{getPanelLabel(r.panelId, lang)}</td>
                  <td style={{ padding: "7px 10px", color: "#64748b" }}>{zoneLabel(r.zone)}</td>
                  <td style={{ padding: "7px 10px" }}><strong>{t.services[r.service]}</strong></td>
                  <td style={{ padding: "7px 10px", textAlign: "right", fontFamily: "monospace" }}>
                    {r.priceNet ? `${parseFloat(r.priceNet).toFixed(2)} €` : "–"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Options + VAT */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
          <div>
            {(customer.abBring || customer.leihwagen) && (
              <div style={{ border: "1px solid #e2e8f0", borderRadius: "6px", padding: "10px" }}>
                <div style={{ fontWeight: "bold", fontSize: "11px", color: "#475569", marginBottom: "6px", textTransform: "uppercase" }}>Zusatzleistungen</div>
                {customer.abBring && <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "3px" }}><span>Hol-/Bring-Service (30km)</span><span>59,00 €</span></div>}
                {customer.leihwagen && <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}><span>Leihwagen</span><span>39,00 € /Tag</span></div>}
              </div>
            )}
          </div>
          <div style={{ border: "1px solid #e2e8f0", borderRadius: "6px", padding: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "3px" }}><span>Nettobetrag</span><span>{totalNet.toFixed(2)} €</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "3px" }}><span>MwSt. 19%</span><span>{vatAmt.toFixed(2)} €</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", fontWeight: "bold", borderTop: "1px solid #e2e8f0", paddingTop: "6px", marginTop: "6px" }}><span>Gesamtbetrag</span><span style={{ color: "#b91c1c" }}>{totalGross.toFixed(2)} €</span></div>
          </div>
        </div>

        {/* Photos */}
        {photos.length > 0 && (
          <div style={{ marginBottom: "14px" }}>
            <div style={{ fontWeight: "bold", fontSize: "11px", color: "#475569", marginBottom: "6px", textTransform: "uppercase" }}>Fahrzeugfotos</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {photos.map((ph) => <img key={ph.id} src={ph.dataUrl} alt={ph.name} style={{ width: "130px", height: "95px", objectFit: "cover", borderRadius: "4px", border: "1px solid #e2e8f0" }}/>)}
            </div>
          </div>
        )}

        <div style={{ fontSize: "10px", color: "#64748b", lineHeight: "1.4", marginBottom: "12px", padding: "8px", background: "#f8fafc", borderRadius: "4px" }}>
          {t.legalText}
        </div>
        <div style={{ background: "#f8fafc", padding: "8px 14px", borderRadius: "4px", marginBottom: "12px", fontSize: "11px", color: "#475569", textAlign: "center" }}>
          ★ {t.warranty}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginTop: "8px" }}>
          <div style={{ marginTop: "32px" }}><div style={{ borderTop: "1px solid #000", paddingTop: "4px", fontSize: "10px", color: "#64748b" }}>{t.sigCustomer}</div></div>
          <div style={{ marginTop: "32px" }}><div style={{ borderTop: "1px solid #000", paddingTop: "4px", fontSize: "10px", color: "#64748b" }}>{t.sigShop}</div></div>
        </div>
      </div>

      {/* ADMIN PRINT = same as client but with partner info */}
      <div id="print-admin" style={{ display: "none", padding: "24px", fontFamily: "sans-serif", color: "#111", fontSize: "13px" }}>
        <div style={{ background: "#1e3a5f", color: "white", padding: "12px 20px", borderRadius: "6px", marginBottom: "16px", display: "flex", justifyContent: "space-between" }}>
          <div><div style={{ fontSize: "17px", fontWeight: "bold" }}>Vollständiger Auftrag (Admin)</div>
            <div style={{ fontSize: "11px", opacity: 0.8 }}>Corion Lackdoktor</div></div>
          <div style={{ textAlign: "right", fontSize: "11px" }}>
            <div>Datum: {orderDate}</div>
            {assignedPartner && <div style={{ marginTop: "4px" }}>Partner: <strong>{assignedPartner.firstName} {assignedPartner.lastName}</strong></div>}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "14px" }}>
          <div style={{ border: "1px solid #e2e8f0", borderRadius: "6px", padding: "10px" }}>
            <div style={{ fontWeight: "bold", fontSize: "10px", color: "#475569", marginBottom: "6px" }}>KUNDENDATEN</div>
            <div><strong>{customer.name||"–"}</strong></div>
            <div style={{ fontSize: "12px", color: "#64748b" }}>{customer.phone} · {customer.email}</div>
            <div style={{ fontSize: "12px", color: "#64748b" }}>{customer.address}</div>
            {customer.abNummer && <div style={{ fontSize: "11px" }}>AB/AG: {customer.abNummer}</div>}
          </div>
          <div style={{ border: "1px solid #e2e8f0", borderRadius: "6px", padding: "10px" }}>
            <div style={{ fontWeight: "bold", fontSize: "10px", color: "#475569", marginBottom: "6px" }}>FAHRZEUG</div>
            <div><strong>{customer.vehicle} {customer.model}</strong></div>
            <div style={{ fontSize: "12px", color: "#64748b" }}>KZ: {customer.plate||"–"} · {customer.color||"–"}</div>
            <div style={{ fontSize: "11px", color: "#64748b" }}>FIN: {customer.vin||"–"}</div>
          </div>
          <div style={{ border: "1px solid #e2e8f0", borderRadius: "6px", padding: "10px" }}>
            <div style={{ fontWeight: "bold", fontSize: "10px", color: "#475569", marginBottom: "6px" }}>KALKULATION</div>
            <div style={{ fontSize: "12px" }}>Netto: {totalNet.toFixed(2)} €</div>
            <div style={{ fontSize: "12px" }}>MwSt.: {vatAmt.toFixed(2)} €</div>
            <div style={{ fontWeight: "bold" }}>Gesamt: {totalGross.toFixed(2)} €</div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: "8px", marginBottom: "14px", alignItems: "center" }}>
          <PrintCarSVG repairs={repairs} view="left"/>
          <PrintCarSVG repairs={repairs} view="top"/>
          <PrintCarSVG repairs={repairs} view="right"/>
        </div>
        <PrintLegend repairs={repairs} lang={lang}/>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", marginBottom: "14px" }}>
          <thead><tr style={{ background: "#1e3a5f", color: "white" }}>
            <th style={{ padding: "6px 10px", textAlign: "left" }}>Pos.</th>
            <th style={{ padding: "6px 10px", textAlign: "left" }}>Bauteil</th>
            <th style={{ padding: "6px 10px", textAlign: "left" }}>Zone</th>
            <th style={{ padding: "6px 10px", textAlign: "left" }}>Leistung</th>
            <th style={{ padding: "6px 10px", textAlign: "right" }}>Netto</th>
          </tr></thead>
          <tbody>{repairs.map((r, i) => (
            <tr key={r.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
              <td style={{ padding: "6px 10px", color: "#64748b" }}>{i+1}</td>
              <td style={{ padding: "6px 10px", fontWeight: "500" }}>{getPanelLabel(r.panelId, lang)}</td>
              <td style={{ padding: "6px 10px", color: "#64748b" }}>{zoneLabel(r.zone)}</td>
              <td style={{ padding: "6px 10px" }}><strong>{t.services[r.service]}</strong></td>
              <td style={{ padding: "6px 10px", textAlign: "right", fontFamily: "monospace" }}>{r.priceNet?`${parseFloat(r.priceNet).toFixed(2)} €`:"–"}</td>
            </tr>))}</tbody>
        </table>
        {photos.length > 0 && <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {photos.map(ph => <img key={ph.id} src={ph.dataUrl} alt={ph.name} style={{ width: "120px", height: "90px", objectFit: "cover", borderRadius: "4px", border: "1px solid #e2e8f0" }}/>)}
        </div>}
      </div>

      {/* ══ MAIN SCREEN UI ══════════════════════════════════════════════════ */}
      <div className="min-h-screen bg-background text-foreground">

        {/* ── Sticky header ── */}
        <header className="sticky top-0 z-40 bg-card border-b border-border px-3 py-2 flex flex-wrap items-center gap-2 no-print">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Button size="icon" variant="ghost" onClick={() => window.history.back()}
              data-testid="button-back-to-app" title="Zurück zur App" className="flex-shrink-0 h-7 w-7">
              <ArrowLeft className="w-4 h-4"/>
            </Button>
            <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0"/>
            <h1 className="text-sm font-bold truncate">{t.title}</h1>
          </div>

          {/* Language selector */}
          <div className="flex items-center gap-1 border border-border rounded-md overflow-hidden flex-shrink-0">
            {(["de","ro","es"] as Lang[]).map((l) => (
              <button key={l} onClick={() => setLang(l)}
                className={`px-2.5 py-1 text-xs font-semibold transition-colors ${lang===l?"bg-primary text-white":"text-muted-foreground hover:bg-muted"}`}>
                {l.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => { setRepairs([]); setCustomer(emptyCustomer); setPhotos([]); }}
              className="gap-1 text-xs h-8"><Trash2 className="w-3 h-3"/> Reset</Button>
            <Button variant="outline" size="sm" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}
              className="gap-1 text-xs h-8"><Save className="w-3 h-3"/> {t.saveCrm}</Button>
            <Button variant="outline" size="sm" onClick={openWhatsAppDialog}
              className="gap-1 text-xs h-8 border-green-500/40 text-green-400">
              <MessageCircle className="w-3 h-3"/> {t.shareWA}</Button>
            <Button variant="outline" size="sm" onClick={() => setEmailDlgOpen(true)}
              className="gap-1 text-xs h-8"><Mail className="w-3 h-3"/> {t.shareEmail}</Button>

            {/* Print dropdown */}
            <div className="relative group">
              <Button size="sm" className="gap-1 text-xs h-8 bg-primary pr-2">
                <Printer className="w-3 h-3"/> Drucken <ChevronDown className="w-3 h-3 ml-0.5"/>
              </Button>
              <div className="absolute right-0 top-full mt-1 bg-popover border border-border rounded-md shadow-lg z-50 hidden group-hover:block min-w-44">
                <button onClick={() => doPrint("admin")} className="w-full text-left px-3 py-2 text-xs hover:bg-muted flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 text-blue-400"/> {t.printAdmin}
                </button>
                <button onClick={() => doPrint("partner")} className="w-full text-left px-3 py-2 text-xs hover:bg-muted flex items-center gap-2">
                  <UserIcon className="w-3.5 h-3.5 text-green-400"/> {t.printPartner}
                </button>
                <button onClick={() => doPrint("client")} className="w-full text-left px-3 py-2 text-xs hover:bg-muted flex items-center gap-2">
                  <UserIcon className="w-3.5 h-3.5 text-primary"/> {t.printClient}
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-[1400px] mx-auto p-4 grid grid-cols-1 xl:grid-cols-[1fr_480px] gap-5">

          {/* ══ LEFT: Car diagram + photos ════════════════════════════════ */}
          <div className="no-print space-y-3">

            {/* Car diagram — DAT-style tool palette */}
            <div className="bg-card border border-border rounded-md" style={{ overflow: "visible" }}>

              {/* ── Header bar: title + view switcher ── */}
              <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-black/20">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold tracking-tight">Fahrzeugskizze</h2>
                  {hoveredPanel && (
                    <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full border border-border">
                      {ALL_PANELS.find(p => p.id === hoveredPanel)?.label ?? hoveredPanel}
                    </span>
                  )}
                </div>
                <div className="flex gap-1">
                  {(["left","top","right"] as const).map((v) => (
                    <button key={v} onClick={() => { setActiveView(v); setPopup(null); }}
                      className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${activeView===v?"bg-primary text-white border-primary":"border-border text-muted-foreground hover:bg-muted"}`}>
                      {v==="left"?t.viewLeft:v==="top"?t.viewTop:t.viewRight}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Service palette toolbar (DAT-style) ── */}
              <div className="flex flex-wrap items-center gap-1.5 px-3 py-2 border-b border-border bg-black/30">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider mr-1 shrink-0">Werkzeug:</span>
                {SERVICE_KEYS.map((svc) => {
                  const c = SERVICE_SVG_COLORS[svc];
                  const isActive = activeTool === svc;
                  const count = repairs.filter(r => r.service === svc).length;
                  return (
                    <button key={svc} onClick={() => setActiveTool(svc)} data-testid={`tool-${svc}`}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-medium border transition-all ${isActive ? "ring-2 ring-offset-1 ring-offset-black scale-105" : "opacity-70 hover:opacity-100"}`}
                      style={{
                        background: isActive ? c.fill : c.fill + "55",
                        borderColor: c.stroke,
                        color: c.text,
                        ["--tw-ring-color" as any]: c.stroke,
                      }}>
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: c.dot }}/>
                      {t.services[svc]}
                      {count > 0 && (
                        <span className="text-[9px] font-bold px-1 rounded-full" style={{ background: c.dot, color: "#fff" }}>{count}</span>
                      )}
                    </button>
                  );
                })}
                {/* Eraser tool */}
                <button onClick={() => setActiveTool("eraser")} data-testid="tool-eraser"
                  className={`flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-medium border transition-all ml-1 ${activeTool==="eraser"?"bg-slate-600 border-slate-400 text-white ring-2 ring-slate-400 ring-offset-1 ring-offset-black scale-105":"bg-slate-800/50 border-slate-600 text-slate-400 opacity-70 hover:opacity-100"}`}>
                  <X className="w-3 h-3"/> Löschen
                </button>
                <span className="ml-auto text-[10px] text-muted-foreground opacity-50 shrink-0">Gestrichelt = 3 Zonen</span>
              </div>

              {/* ── Active tool hint ── */}
              {activeTool !== "eraser" && (() => {
                const c = SERVICE_SVG_COLORS[activeTool];
                return (
                  <div className="flex items-center gap-2 px-3 py-1.5 text-[11px]" style={{ background: c.fill + "22", borderBottom: `1px solid ${c.stroke}33` }}>
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: c.dot }}/>
                    <span style={{ color: c.text }}>
                      Aktives Werkzeug: <strong>{t.services[activeTool]}</strong> — Klicken Sie auf eine Karosseriefläche
                    </span>
                  </div>
                );
              })()}
              {activeTool === "eraser" && (
                <div className="flex items-center gap-2 px-3 py-1.5 text-[11px] bg-slate-800/30 border-b border-slate-600/20">
                  <X className="w-3 h-3 text-slate-400"/>
                  <span className="text-slate-400">Löschwerkzeug aktiv — Klicken Sie auf eine markierte Fläche zum Entfernen</span>
                </div>
              )}

              {/* ── SVG car diagram ── */}
              <div className="relative" onClick={() => setPopup(null)}>
                {isSide ? (
                  <svg viewBox="0 0 760 252" className="w-full block" style={{ cursor: activeTool === "eraser" ? "cell" : "crosshair" }}>
                    <defs>
                      <radialGradient id="bg-glow" cx="50%" cy="40%" r="50%">
                        <stop offset="0%" stopColor="#1e293b"/>
                        <stop offset="100%" stopColor="#0a0f1a"/>
                      </radialGradient>
                    </defs>
                    <rect width="760" height="252" fill="url(#bg-glow)" rx="0"/>
                    {/* Grid lines */}
                    {Array.from({length: 7}).map((_,i) => (
                      <line key={i} x1={i*120+20} y1="0" x2={i*120+20} y2="252" stroke="#1e293b" strokeWidth="1" opacity="0.6"/>
                    ))}
                    {/* Car body silhouette */}
                    <path d={SEDAN_LEFT_PATH} fill="#172033" stroke="#2d3f55" strokeWidth="2"
                      transform={activeView==="right"?"scale(-1,1) translate(-760,0)":undefined}/>

                    {/* ── CAR DETAILS (non-clickable decorative) ── */}
                    <g transform={activeView==="right"?"scale(-1,1) translate(-760,0)":undefined} pointerEvents="none">
                      {/* Body highlight / reflection line */}
                      <path d="M 82,142 Q 200,128 258,124 L 590,124 Q 640,126 680,134" fill="none" stroke="#2a3f58" strokeWidth="1.5" opacity="0.7"/>

                      {/* Windshield glass */}
                      <polygon points="262,112 262,70 374,60 374,112" fill="#0d1f35" stroke="#2d4a6e" strokeWidth="1.5" opacity="0.9"/>
                      {/* Windshield glare */}
                      <polygon points="270,108 270,74 310,66 310,108" fill="white" opacity="0.04"/>
                      <line x1="310" y1="66" x2="278" y2="108" stroke="white" strokeWidth="0.5" opacity="0.06"/>

                      {/* Front door window */}
                      <rect x="266" y="64" width="162" height="44" rx="2" fill="#0d1f35" stroke="#2d4a6e" strokeWidth="1.5" opacity="0.9"/>
                      <rect x="271" y="67" width="60" height="38" rx="1" fill="white" opacity="0.03"/>

                      {/* Rear door window */}
                      <rect x="434" y="64" width="148" height="44" rx="2" fill="#0d1f35" stroke="#2d4a6e" strokeWidth="1.5" opacity="0.9"/>

                      {/* Rear window */}
                      <polygon points="590,112 590,64 700,64 704,96 700,112" fill="#0d1f35" stroke="#2d4a6e" strokeWidth="1.5" opacity="0.9"/>

                      {/* A-pillar (between hood and windshield) */}
                      <line x1="262" y1="70" x2="262" y2="112" stroke="#1e3a52" strokeWidth="3" opacity="0.8"/>
                      {/* B-pillar (between front and rear door) */}
                      <line x1="430" y1="60" x2="430" y2="112" stroke="#1e3a52" strokeWidth="4" opacity="0.9"/>
                      {/* C-pillar */}
                      <line x1="590" y1="62" x2="590" y2="112" stroke="#1e3a52" strokeWidth="3" opacity="0.8"/>

                      {/* Door handle front */}
                      <rect x="390" y="155" width="22" height="6" rx="3" fill="#2a3f58" stroke="#3d5878" strokeWidth="1"/>
                      {/* Door handle rear */}
                      <rect x="556" y="155" width="22" height="6" rx="3" fill="#2a3f58" stroke="#3d5878" strokeWidth="1"/>

                      {/* Door seam: front/rear door */}
                      <line x1="428" y1="112" x2="428" y2="210" stroke="#0f1e2e" strokeWidth="2.5" opacity="0.9"/>
                      {/* Door seam: rear door/quarter */}
                      <line x1="588" y1="112" x2="588" y2="210" stroke="#0f1e2e" strokeWidth="2.5" opacity="0.9"/>

                      {/* Hood crease line */}
                      <path d="M 82,168 Q 140,148 195,142" fill="none" stroke="#1e3a52" strokeWidth="1" opacity="0.6"/>

                      {/* Headlight (stylized) */}
                      <rect x="14" y="102" width="58" height="44" rx="3" fill="#0a1826" stroke="#1e3a52" strokeWidth="1.5"/>
                      <rect x="18" y="106" width="50" height="16" rx="2" fill="#0d2035" stroke="#1e4080" strokeWidth="1" opacity="0.8"/>
                      <line x1="18" y1="122" x2="68" y2="122" stroke="#1e4080" strokeWidth="0.5" opacity="0.5"/>
                      <rect x="18" y="124" width="50" height="18" rx="2" fill="#0d1829" stroke="#1e3050" strokeWidth="1" opacity="0.5"/>
                      {/* Headlight glow */}
                      <rect x="22" y="108" width="22" height="12" rx="2" fill="#1e3f70" opacity="0.3"/>

                      {/* Taillight (stylized) */}
                      <rect x="700" y="98" width="54" height="54" rx="3" fill="#0a1015" stroke="#3a1515" strokeWidth="1.5"/>
                      <rect x="704" y="102" width="46" height="22" rx="2" fill="#1a0808" stroke="#5a1010" strokeWidth="1" opacity="0.9"/>
                      <line x1="704" y1="124" x2="750" y2="124" stroke="#3a1010" strokeWidth="0.5"/>
                      <rect x="704" y="126" width="46" height="22" rx="2" fill="#150a0a" stroke="#3a1010" strokeWidth="1" opacity="0.6"/>

                      {/* Grille area */}
                      <rect x="10" y="175" width="66" height="42" rx="3" fill="#0a1015" stroke="#1e3052" strokeWidth="1"/>
                      {[0,1,2,3].map(i => (
                        <line key={i} x1="12" y1={180+i*8} x2="74" y2={180+i*8} stroke="#1e3052" strokeWidth="1" opacity="0.7"/>
                      ))}
                      {[0,1,2,3,4].map(i => (
                        <line key={i} x1={16+i*12} y1="177" x2={16+i*12} y2="215" stroke="#1e3052" strokeWidth="0.8" opacity="0.5"/>
                      ))}

                      {/* Door bottom sill highlight */}
                      <rect x="258" y="210" width="330" height="16" rx="1" fill="#0f1e2e" stroke="#1a2c42" strokeWidth="1" opacity="0.6"/>

                      {/* Mirror */}
                      <path d="M 216,96 Q 250,92 252,107 Q 250,118 216,120 Z" fill="#1a2a3a" stroke="#2d4255" strokeWidth="1.2"/>
                    </g>

                    {/* Wheel arches */}
                    {[activeView==="right"?568:192, activeView==="right"?184:576].map((cx,i) => (
                      <g key={i}>
                        <circle cx={cx} cy="228" r="48" fill="#050c14" stroke="#243040" strokeWidth="2"/>
                        <circle cx={cx} cy="228" r="36" fill="#080d15" stroke="#1e2a38" strokeWidth="1.5"/>
                        <circle cx={cx} cy="228" r="24" fill="#0d1520" stroke="#2d3d50" strokeWidth="1.5"/>
                        <circle cx={cx} cy="228" r="13" fill="#162030" stroke="#3d5268" strokeWidth="1"/>
                        {/* Spoke details */}
                        {[0,60,120,180,240,300].map((deg,si) => (
                          <line key={si}
                            x1={cx + Math.cos(deg*Math.PI/180)*13} y1={228 + Math.sin(deg*Math.PI/180)*13}
                            x2={cx + Math.cos(deg*Math.PI/180)*23} y2={228 + Math.sin(deg*Math.PI/180)*23}
                            stroke="#3d5268" strokeWidth="2.5" strokeLinecap="round"/>
                        ))}
                        <circle cx={cx} cy="228" r="4" fill="#243040"/>
                      </g>
                    ))}

                    {/* View label */}
                    <text x="12" y="16" fill="#3d5068" fontSize="9" fontWeight="700" letterSpacing="1">
                      {activeView==="left"?"◄ LINKE SEITE":"RECHTE SEITE ►"}
                    </text>
                    {viewPanels.map((p) => <PanelRect key={p.id} p={p}/>)}
                    {popup && popup.panel.view===activeView && (
                      <circle cx={popup.x} cy={popup.y} r="4" fill="#f59e0b" stroke="#fcd34d" strokeWidth="1"/>
                    )}
                  </svg>
                ) : (
                  <svg viewBox="0 0 362 732" className="w-52 mx-auto block" style={{ cursor: activeTool === "eraser" ? "cell" : "crosshair" }}>
                    <defs>
                      <radialGradient id="bg-glow-top" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#1a2436"/>
                        <stop offset="100%" stopColor="#080d15"/>
                      </radialGradient>
                    </defs>
                    <rect width="362" height="732" fill="url(#bg-glow-top)" rx="0"/>
                    <rect x="36" y="8" width="290" height="716" rx="20" fill="#172033" stroke="#2d3f55" strokeWidth="2"/>
                    {/* Axle lines */}
                    <path d="M 42,226 Q 181,218 320,226" fill="none" stroke="#2d3f55" strokeWidth="1" strokeDasharray="4 4"/>
                    <path d="M 42,468 Q 181,476 320,468" fill="none" stroke="#2d3f55" strokeWidth="1" strokeDasharray="4 4"/>
                    {/* Center axis */}
                    <line x1="181" y1="8" x2="181" y2="724" stroke="#1e3a5f" strokeWidth="1" strokeDasharray="8 4" opacity="0.4"/>
                    <text x="181" y="22" textAnchor="middle" fill="#3d5068" fontSize="8" fontWeight="700" letterSpacing="1">DRAUFSICHT</text>
                    {viewPanels.map((p) => <PanelRect key={p.id} p={p}/>)}
                    {popup && popup.panel.view==="top" && (
                      <circle cx={popup.x} cy={popup.y} r="4" fill="#f59e0b" stroke="#fcd34d" strokeWidth="1"/>
                    )}
                  </svg>
                )}

                {/* Popup */}
                {popup && popup.panel.view===activeView && (
                  <ServicePopup
                    popup={popup} pendingZone={pendingZone} pendingService={pendingService}
                    pendingPrice={pendingPrice} noZones={popup.panel.noZones} t={t}
                    onZone={setPendingZone} onService={setPendingService} onPrice={setPendingPrice}
                    onConfirm={confirmRepair} onRemove={() => { removeRepair(popup.panel.id); setPopup(null); }}
                    onClose={() => setPopup(null)} hasExisting={repairedIds.has(popup.panel.id)}
                  />
                )}
                {popup && popup.panel.view==="top" && activeView==="top" && (
                  <ServicePopup
                    popup={popup} pendingZone={pendingZone} pendingService={pendingService}
                    pendingPrice={pendingPrice} noZones={true} t={t}
                    onZone={setPendingZone} onService={setPendingService} onPrice={setPendingPrice}
                    onConfirm={confirmRepair} onRemove={() => { removeRepair(popup.panel.id); setPopup(null); }}
                    onClose={() => setPopup(null)} hasExisting={repairedIds.has(popup.panel.id)}
                  />
                )}
              </div>

              {/* ── Summary strip ── */}
              {repairs.length > 0 && (
                <div className="flex items-center gap-3 px-3 py-1.5 bg-black/20 border-t border-border text-[11px]">
                  <span className="text-muted-foreground">{repairs.length} Position{repairs.length!==1?"en":""} markiert</span>
                  <div className="flex gap-1 flex-wrap">
                    {SERVICE_KEYS.filter(s => repairs.some(r => r.service === s)).map(s => {
                      const c = SERVICE_SVG_COLORS[s];
                      return (
                        <span key={s} className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px]"
                          style={{ background: c.fill + "88", color: c.text, border: `1px solid ${c.stroke}55` }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.dot }}/>
                          {t.services[s]}: {repairs.filter(r => r.service === s).length}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Photos */}
            <div className="bg-card border border-border rounded-md p-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold">{t.photoTitle}</h3>
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}
                  className="gap-1.5 text-xs h-8"><Camera className="w-3.5 h-3.5"/> {t.addPhoto}</Button>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
                onChange={handleFileChange} data-testid="input-photos"/>
              {photos.length === 0 ? (
                <div className="text-xs text-muted-foreground text-center py-4 border border-dashed border-border rounded-md cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}>
                  <Camera className="w-5 h-5 mx-auto mb-1 opacity-40"/>{t.photoDrop}
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {photos.map((ph) => (
                    <div key={ph.id} className="relative group">
                      <img src={ph.dataUrl} alt={ph.name} className="w-full aspect-square object-cover rounded-md border border-border"/>
                      <button onClick={() => setPhotos((p) => p.filter((x) => x.id !== ph.id))}
                        className="absolute top-0.5 right-0.5 bg-black/70 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="w-3 h-3 text-white"/>
                      </button>
                    </div>
                  ))}
                  <button onClick={() => fileInputRef.current?.click()}
                    className="aspect-square border-2 border-dashed border-border rounded-md flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                    <Plus className="w-5 h-5"/>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ══ RIGHT: Form + report ══════════════════════════════════════ */}
          <div className="space-y-4">

            {/* Document header */}
            <div className="bg-primary rounded-md p-4 text-white">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-base font-bold">{t.title}</h2>
                  <p className="text-red-100 text-xs mt-0.5">{t.subtitle}</p>
                </div>
                <div className="text-right text-xs text-red-100 flex-shrink-0">
                  <p className="font-semibold text-white">Lackdoktor - Hofheim Wallau</p>
                  <p>Nassaustraße 41, 65719 Hofheim</p>
                  <p className="mt-0.5">0176 83 45 82 74</p>
                </div>
              </div>
            </div>

            {/* Vehicle CRM */}
            <div className="bg-card border border-border rounded-md p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{t.sectionVehicle}</h3>
                {/* KFZ OCR button */}
                <div className="relative">
                  <Button variant="outline" size="sm" disabled={kfzLoading}
                    onClick={() => kfzInputRef.current?.click()}
                    className="gap-1.5 text-xs h-7 border-blue-500/30 text-blue-400">
                    <Scan className="w-3 h-3"/>
                    {kfzLoading ? t.kfzLoading : t.kfzBtn}
                  </Button>
                  <input ref={kfzInputRef} type="file" accept="image/*" className="hidden"
                    onChange={handleKfzScan} data-testid="input-kfz"/>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <FormField label={t.fieldMake} value={customer.vehicle} onChange={(v) => setCustomerField("vehicle", v)} placeholder="BMW, VW ..." testId="input-make"/>
                <FormField label={t.fieldModel} value={customer.model} onChange={(v) => setCustomerField("model", v)} placeholder="3er, Golf ..." testId="input-model"/>
                <FormField label={t.fieldPlate} value={customer.plate} onChange={(v) => setCustomerField("plate", v)} placeholder="MTK-XX 123" testId="input-plate"/>
                <FormField label={t.fieldColor} value={customer.color} onChange={(v) => setCustomerField("color", v)} placeholder="Schwarz ..." testId="input-color"/>
                <FormField label={t.fieldVin} value={customer.vin} onChange={(v) => setCustomerField("vin", v)} placeholder="WBA..." testId="input-vin"/>
                <FormField label={t.fieldMileage} value={customer.mileage} onChange={(v) => setCustomerField("mileage", v)} placeholder="85.000 km" testId="input-mileage"/>
              </div>

              <div className="border-t border-border mt-3 pt-3">
                <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">{t.sectionCrm}</h3>
                <div className="grid grid-cols-2 gap-2">
                  <FormField label={t.fieldName} value={customer.name} onChange={(v) => setCustomerField("name", v)} placeholder="Vollständiger Name" testId="input-name"/>
                  <FormField label={t.fieldAb} value={customer.abNummer} onChange={(v) => setCustomerField("abNummer", v)} placeholder="AB-123" testId="input-ab"/>
                  <FormField label={t.fieldPhone} value={customer.phone} onChange={(v) => setCustomerField("phone", v)} placeholder="+49 ..." testId="input-phone"/>
                  <FormField label={t.fieldEmail} value={customer.email} onChange={(v) => setCustomerField("email", v)} placeholder="email@..." testId="input-email"/>
                  <div className="col-span-2">
                    <FormField label={t.fieldAddress} value={customer.address} onChange={(v) => setCustomerField("address", v)} placeholder="Straße, PLZ, Ort" testId="input-address"/>
                  </div>
                </div>
              </div>

              {/* Partner + extras */}
              <div className="grid grid-cols-2 gap-2 mt-2.5">
                <div className="space-y-1 col-span-2">
                  <Label className="text-[10px] text-muted-foreground uppercase">{t.partner}</Label>
                  <Select value={partnerId} onValueChange={setPartnerId}>
                    <SelectTrigger className="h-8 text-xs" data-testid="select-partner">
                      <SelectValue placeholder={t.noPartner}/>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t.noPartner}</SelectItem>
                      {partners.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.firstName ? `${p.firstName} ${p.lastName ?? ""}`.trim() : p.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input type="checkbox" checked={customer.abBring} className="rounded"
                    onChange={(e) => setCustomerField("abBring", e.target.checked)} data-testid="check-ab-bring"/>
                  {t.abBring} <strong>{t.abBringPrice}</strong>
                </label>
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input type="checkbox" checked={customer.leihwagen} className="rounded"
                    onChange={(e) => setCustomerField("leihwagen", e.target.checked)} data-testid="check-leihwagen"/>
                  {t.leihwagen} <strong>{t.leihwagenPrice}</strong>
                </label>
              </div>
            </div>

            {/* Repair table */}
            <div className="bg-card border border-border rounded-md p-4">
              <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3">{t.sectionRepairs}</h3>
              {repairs.length === 0 ? (
                <div className="text-center py-6 text-xs text-muted-foreground border border-dashed border-border rounded-md">
                  {t.emptyRepairs}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-1.5 px-2 text-muted-foreground font-semibold w-5">#</th>
                        <th className="text-left py-1.5 px-2 text-muted-foreground font-semibold">Bauteil</th>
                        <th className="text-left py-1.5 px-2 text-muted-foreground font-semibold w-14">Zone</th>
                        <th className="text-left py-1.5 px-2 text-muted-foreground font-semibold">Leistung</th>
                        <th className="text-right py-1.5 px-2 text-muted-foreground font-semibold w-20">Netto</th>
                        <th className="py-1.5 px-2 w-6"/>
                      </tr>
                    </thead>
                    <tbody>
                      {repairs.map((r, i) => (
                        <tr key={r.id} className="border-b border-border/40 hover:bg-muted/20">
                          <td className="py-1.5 px-2 text-muted-foreground">{i+1}</td>
                          <td className="py-1.5 px-2 font-medium">{getPanelLabel(r.panelId, lang)}</td>
                          <td className="py-1.5 px-2">
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-slate-600 text-slate-400">{zoneLabel(r.zone)}</Badge>
                          </td>
                          <td className="py-1.5 px-2">
                            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${SERVICE_COLORS[r.service]}`}>{t.services[r.service]}</Badge>
                          </td>
                          <td className="py-1.5 px-2 text-right font-mono">
                            {r.priceNet ? `${parseFloat(r.priceNet).toFixed(2)} €` : "–"}
                          </td>
                          <td className="py-1.5 px-2">
                            <button onClick={() => removeRepair(r.panelId)} className="text-muted-foreground hover:text-red-400" data-testid={`btn-remove-${r.panelId}`}>
                              <X className="w-3.5 h-3.5"/>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {repairs.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border space-y-1.5">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{t.netLabel}</span><span className="font-mono">{totalNet.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{t.vat19}</span><span className="font-mono">{vatAmt.toFixed(2)} €</span>
                  </div>
                  {customer.abBring && <div className="flex justify-between text-xs text-muted-foreground"><span>{t.abBring}</span><span className="font-mono">59,00 €</span></div>}
                  {customer.leihwagen && <div className="flex justify-between text-xs text-muted-foreground"><span>{t.leihwagen}</span><span className="font-mono">39,00 € /Tag</span></div>}
                  <div className="flex justify-between text-sm font-bold border-t border-border pt-1.5">
                    <span className="flex items-center gap-1.5"><Calculator className="w-3.5 h-3.5"/> {t.gross}</span>
                    <span className="font-mono text-primary">{totalGross.toFixed(2)} €</span>
                  </div>
                </div>
              )}
            </div>

            {/* Signature */}
            <div className="bg-card border border-border rounded-md p-4">
              <p className="text-[10px] text-muted-foreground leading-relaxed mb-4">{t.legalText}</p>
              <div className="grid grid-cols-2 gap-6">
                <div><div className="border-b border-border h-10 mb-1"/><p className="text-[10px] text-muted-foreground">{t.sigCustomer}</p></div>
                <div><div className="border-b border-border h-10 mb-1"/><p className="text-[10px] text-muted-foreground">{t.sigShop}</p></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Email Dialog ── */}
      <Dialog open={emailDlgOpen} onOpenChange={setEmailDlgOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{t.emailDlgTitle}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">{t.emailDlgTo}</Label>
              <Input value={emailTo} onChange={(e) => setEmailTo(e.target.value)} placeholder="partner@example.de" type="email" className="h-8 text-sm" data-testid="input-email-to"/>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">{t.emailDlgMode}</Label>
              <Select value={emailMode} onValueChange={(v: any) => setEmailMode(v)}>
                <SelectTrigger className="h-8 text-sm" data-testid="select-email-mode"><SelectValue/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="partner">{t.printPartner} (ohne Kundendaten &amp; Preise)</SelectItem>
                  <SelectItem value="client">{t.printClient} (mit Preisen)</SelectItem>
                  <SelectItem value="admin">{t.printAdmin} (vollständig)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={sendEmail} disabled={emailSending || !emailTo}>
              {emailSending ? "Wird gesendet..." : t.emailDlgSend}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── WhatsApp Mode Dialog ── */}
      <Dialog open={waDlgOpen} onOpenChange={setWaDlgOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-green-500"/>
              WhatsApp – Version wählen
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-xs text-muted-foreground">Welche Version soll per WhatsApp geteilt werden?</p>
            <div className="space-y-2">
              <button onClick={() => doShareWhatsApp("partner")}
                className="w-full flex items-center gap-3 p-3 rounded-md border border-border hover:bg-muted transition-colors text-left">
                <UserIcon className="w-4 h-4 text-green-400 flex-shrink-0"/>
                <div>
                  <div className="text-sm font-semibold">{t.printPartner}</div>
                  <div className="text-xs text-muted-foreground">Nur Fahrzeug & Arbeitsumfang, ohne Kundendaten und Preise</div>
                </div>
              </button>
              <button onClick={() => doShareWhatsApp("client")}
                className="w-full flex items-center gap-3 p-3 rounded-md border border-border hover:bg-muted transition-colors text-left">
                <UserIcon className="w-4 h-4 text-primary flex-shrink-0"/>
                <div>
                  <div className="text-sm font-semibold">{t.printClient}</div>
                  <div className="text-xs text-muted-foreground">Mit Kundendaten, Leistungen und Preisen</div>
                </div>
              </button>
              <button onClick={() => doShareWhatsApp("admin")}
                className="w-full flex items-center gap-3 p-3 rounded-md border border-border hover:bg-muted transition-colors text-left">
                <Building2 className="w-4 h-4 text-blue-400 flex-shrink-0"/>
                <div>
                  <div className="text-sm font-semibold">{t.printAdmin}</div>
                  <div className="text-xs text-muted-foreground">Vollständige Informationen inkl. Partner</div>
                </div>
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── Reusable form field ────────────────────────────────────────────────────
function FormField({ label, value, onChange, placeholder, testId }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; testId?: string;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="h-8 text-xs" data-testid={testId}/>
    </div>
  );
}

// ── Service selection popup ────────────────────────────────────────────────
function ServicePopup({ popup, pendingZone, pendingService, pendingPrice, noZones, t,
  onZone, onService, onPrice, onConfirm, onRemove, onClose, hasExisting }: {
  popup: PopupState; pendingZone: string; pendingService: ServiceKey; pendingPrice: string;
  noZones?: boolean; t: typeof T["de"];
  onZone: (z: string) => void; onService: (s: ServiceKey) => void; onPrice: (p: string) => void;
  onConfirm: () => void; onRemove: () => void; onClose: () => void; hasExisting: boolean;
}) {
  const POPUP_H = noZones ? 270 : 330;
  const POPUP_W = 240;
  const flipUp = popup.y + POPUP_H + 20 > popup.containerH;
  const flipLeft = popup.x + POPUP_W + 10 > 600;
  const top = flipUp ? popup.y - POPUP_H - 8 : popup.y + 10;
  const left = flipLeft ? popup.x - POPUP_W - 4 : Math.min(popup.x + 4, popup.containerH);
  const svcColors = SERVICE_SVG_COLORS[pendingService];
  return (
    <div className="absolute z-[200] bg-popover border rounded-md shadow-2xl w-60 overflow-hidden"
      style={{ left, top, borderColor: svcColors.stroke + "66" }} onClick={(e) => e.stopPropagation()}>
      {/* Colored header strip */}
      <div className="flex items-center justify-between px-3 py-2 border-b"
        style={{ background: svcColors.fill, borderColor: svcColors.stroke + "55" }}>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: svcColors.dot }}/>
          <p className="text-[11px] font-semibold leading-tight" style={{ color: svcColors.text }}>{popup.panel.label}</p>
        </div>
        <button onClick={onClose} style={{ color: svcColors.text }} className="opacity-60 hover:opacity-100 shrink-0"><X className="w-3.5 h-3.5"/></button>
      </div>
      <div className="p-3">

      {!noZones && (
        <div className="mb-2.5">
          <p className="text-[10px] text-muted-foreground uppercase mb-1.5">Zone</p>
          <div className="grid grid-cols-4 gap-1">
            {(["all","top","middle","bottom"] as const).map((z) => {
              const label = z==="all"?t.zoneAll:z==="top"?t.zoneTop:z==="middle"?t.zoneMid:t.zoneBot;
              return (
                <button key={z} onClick={() => onZone(z)}
                  className={`py-1 rounded text-[10px] border transition-colors ${pendingZone===z?"bg-primary text-white border-primary":"border-border text-muted-foreground hover:bg-muted"}`}>
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="mb-2.5">
        <p className="text-[10px] text-muted-foreground uppercase mb-1.5">Leistung</p>
        <div className="space-y-0.5">
          {SERVICE_KEYS.map((s) => {
            const c = SERVICE_SVG_COLORS[s];
            const isSelected = pendingService === s;
            return (
              <button key={s} onClick={() => onService(s)}
                className="w-full text-left px-2 py-1.5 rounded text-xs border transition-all flex items-center gap-2"
                style={{
                  background: isSelected ? c.fill : "transparent",
                  borderColor: isSelected ? c.stroke : "transparent",
                  color: isSelected ? c.text : undefined,
                  outline: isSelected ? `1px solid ${c.stroke}44` : undefined,
                }}>
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: isSelected ? c.dot : "#475569" }}/>
                <span className={isSelected ? "font-semibold" : "text-muted-foreground"}>{t.services[s]}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-3">
        <p className="text-[10px] text-muted-foreground uppercase mb-1.5">Preis (netto, ohne MwSt.)</p>
        <div className="relative">
          <Euro className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground"/>
          <Input value={pendingPrice} onChange={(e) => onPrice(e.target.value)} placeholder="0.00"
            type="number" step="0.01" min="0" className="h-7 text-xs pl-6" data-testid="input-price"/>
        </div>
      </div>

      <div className="flex gap-1.5">
        <Button size="sm" onClick={onConfirm} className="flex-1 h-7 text-xs">{hasExisting?t.updateBtn:t.addBtn}</Button>
        {hasExisting && (
          <Button size="sm" variant="outline" onClick={onRemove} className="h-7 text-xs text-red-400 border-red-500/30">
            <Trash2 className="w-3 h-3"/>
          </Button>
        )}
      </div>
      </div>
    </div>
  );
}
