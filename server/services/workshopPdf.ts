// Branded Auftragsbestätigung PDF (Fixico-style) generated with PDFKit.
// Includes a QR code linking to the order detail page so the customer/partner
// can scan from print to update status.

import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import type { WorkshopOrder } from "@shared/schema";

function eur(cents: number | null | undefined): string {
  const v = ((cents ?? 0) / 100).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `€${v}`;
}

function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const dt = typeof d === "string" ? new Date(d) : d;
  return dt.toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" });
}

export async function renderAuftragPdf(order: WorkshopOrder): Promise<Buffer> {
  const doc = new PDFDocument({ size: "A4", margin: 48 });
  const chunks: Buffer[] = [];
  doc.on("data", (c: Buffer) => chunks.push(c));
  const finished = new Promise<Buffer>((resolve) => doc.on("end", () => resolve(Buffer.concat(chunks))));

  const baseUrl = process.env.PUBLIC_BASE_URL ?? "https://lackdoktor.de";
  const detailUrl = `${baseUrl}/workshop/auftrag/${order.id}`;
  const qrPng = await QRCode.toDataURL(detailUrl, { margin: 1, width: 220 });
  const qrBuf = Buffer.from(qrPng.split(",")[1], "base64");

  // Header
  doc.fillColor("#E53935").font("Helvetica-Bold").fontSize(22).text("+1 CORION", 48, 48);
  doc.fillColor("#111").fontSize(10).font("Helvetica").text("Lackdoktor · Auftragsbestätigung", 48, 76);

  doc.fontSize(10).fillColor("#666")
    .text(`Referenznummer: ${order.referenceNumber ?? order.id.slice(0, 8)}`, 48, 100);
  doc.fillColor("#111").font("Helvetica-Bold").fontSize(16)
    .text(`Reparaturtermin: ${fmtDate(order.scheduledDate)}`, 48, 120);

  // QR top-right
  doc.image(qrBuf, 420, 48, { width: 120, height: 120 });
  doc.fontSize(8).fillColor("#666")
    .text("Scannen für Live-Status", 420, 174, { width: 120, align: "center" });

  // Erwartete Einnahme / Rückgabe band
  doc.moveTo(48, 200).lineTo(547, 200).lineWidth(0.5).strokeColor("#E5E5E5").stroke();
  doc.font("Helvetica-Bold").fontSize(10).fillColor("#111")
    .text("Erwartete Einnahme", 48, 212).text("Erwartete Rückgabe", 300, 212);
  doc.font("Helvetica").fontSize(11).fillColor("#111")
    .text(eur(order.totalAmountCents), 48, 228)
    .text(fmtDate(order.pickupDate ?? order.deliveryDate), 300, 228);

  // Mein Angebot
  let y = 270;
  doc.font("Helvetica-Bold").fontSize(12).fillColor("#111").text("Mein Angebot", 48, y);
  y += 18;
  const rows: Array<[string, string]> = [
    ["Reparaturdauer", "—"],
    ["Preis inkl. MwSt.", eur(order.totalAmountCents)],
    ["Ersatzfahrzeug", "Nein"],
    ["Hol- und Bringservice", "Ja (Preis exkl. MwSt.)"],
    ["Autowäsche", "Ja"],
    ["Original-Ersatzteile", "Nicht zutreffend"],
  ];
  for (const [k, v] of rows) {
    doc.font("Helvetica").fontSize(10).fillColor("#444").text(k, 48, y, { width: 200 });
    doc.fillColor("#111").text(v, 250, y);
    y += 18;
  }

  // Reparaturanfrage / Vehicle
  y += 10;
  doc.font("Helvetica-Bold").fontSize(12).fillColor("#111").text("Reparaturanfrage", 48, y);
  y += 18;
  const vehicleRows: Array<[string, string]> = [
    ["License plate", order.vehiclePlate ?? "—"],
    ["Fahrzeugtyp", `${order.vehicleMake ?? ""} ${order.vehicleModel ?? ""}`.trim() || "—"],
    ["Baujahr", "—"],
    ["FIN", order.vehicleVin ?? "—"],
  ];
  for (const [k, v] of vehicleRows) {
    doc.font("Helvetica").fontSize(10).fillColor("#444").text(k, 48, y, { width: 200 });
    doc.fillColor("#111").text(v, 250, y);
    y += 18;
  }

  // Kundendaten
  y += 10;
  doc.font("Helvetica-Bold").fontSize(12).fillColor("#111").text("KUNDENDATEN", 48, y);
  y += 18;
  const customerRows: Array<[string, string]> = [
    ["Name", order.customerName ?? "—"],
    ["E-Mail", order.customerEmail ?? "—"],
    ["Telefonnummer", order.customerPhone ?? "—"],
    ["Postleitzahl", order.customerAddress ?? "—"],
  ];
  for (const [k, v] of customerRows) {
    doc.font("Helvetica").fontSize(10).fillColor("#444").text(k, 48, y, { width: 200 });
    doc.fillColor("#111").text(v, 250, y);
    y += 18;
  }

  // Reparaturbeschreibung
  if (order.damageDescription) {
    y += 14;
    doc.font("Helvetica-Bold").fontSize(12).fillColor("#111").text("Reparaturbeschreibung", 48, y);
    y += 16;
    doc.font("Helvetica").fontSize(10).fillColor("#333")
      .text(order.damageDescription, 48, y, { width: 499 });
  }

  // Footer
  doc.fontSize(8).fillColor("#888")
    .text(
      `Terminbestätigung · ${order.referenceNumber ?? order.id.slice(0, 8)} · Heruntergeladen am ${new Date().toLocaleString("de-DE")}`,
      48,
      790,
      { width: 499, align: "center" },
    );

  doc.end();
  return finished;
}
