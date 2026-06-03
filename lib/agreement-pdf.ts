/**
 * Server-side agreement PDF generator using PDFKit.
 * Returns a base64-encoded PDF string for upload to Digio eSign.
 */
import PDFDocument from "pdfkit";
import { prisma } from "./db";
import { parseAgreementJsonFields } from "./agreement";
import type { ClausesData, WitnessesData } from "./schemas";
import { format } from "date-fns";

export async function generateAgreementPdf(agreementId: string): Promise<string> {
  const agreement = await prisma.agreement.findUnique({
    where: { id: agreementId },
    select: {
      id: true,
      propertyJson: true,
      ownerJson: true,
      tenantJson: true,
      termsJson: true,
      clausesJson: true,
      witnessesJson: true,
      stampValue: true,
      createdAt: true,
    },
  });

  if (!agreement) throw new Error(`Agreement ${agreementId} not found`);

  const { property, owner, tenant, terms, clauses, witnesses } =
    parseAgreementJsonFields(agreement);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 60 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => {
      const pdf = Buffer.concat(chunks);
      resolve(pdf.toString("base64"));
    });
    doc.on("error", reject);

    const pageW = doc.page.width - 120; // usable width (margins both sides)
    const centerX = doc.page.width / 2;

    // ─── Header ───────────────────────────────────────────────────────────────
    doc
      .font("Helvetica-Bold")
      .fontSize(16)
      .text("RENTAL AGREEMENT", { align: "center" })
      .moveDown(0.3);

    if (agreement.stampValue) {
      doc
        .font("Helvetica")
        .fontSize(11)
        .text(`(Executed on ₹${agreement.stampValue} stamp paper)`, {
          align: "center",
        })
        .moveDown(0.3);
    }

    doc.moveTo(60, doc.y).lineTo(doc.page.width - 60, doc.y).stroke();
    doc.moveDown(0.8);

    // ─── Parties ─────────────────────────────────────────────────────────────
    const today = format(new Date(), "dd MMMM yyyy");
    doc
      .font("Helvetica")
      .fontSize(11)
      .text(
        `This Rental Agreement is entered into on ${today} by and between:`,
      )
      .moveDown(0.5);

    sectionHeading(doc, "FIRST PARTY (OWNER / LANDLORD)");
    if (owner) {
      partyBlock(doc, {
        name: owner.fullName,
        fatherName: owner.fatherName,
        age: owner.age,
        gender: owner.gender,
        pan: owner.pan,
        aadhaarLast4: owner.aadhaarLast4,
        address: owner.addressLine1,
        city: owner.city,
        state: owner.state,
        phone: owner.phone,
        email: owner.email,
      });
    } else {
      doc.text("Owner details not provided.").moveDown(0.5);
    }

    doc.moveDown(0.3);
    sectionHeading(doc, "SECOND PARTY (TENANT)");
    if (tenant) {
      partyBlock(doc, {
        name: tenant.fullName,
        fatherName: tenant.fatherName,
        age: tenant.age,
        gender: tenant.gender,
        pan: tenant.pan,
        aadhaarLast4: tenant.aadhaarLast4,
        address: tenant.addressLine1,
        city: tenant.city,
        state: tenant.state,
        phone: tenant.phone,
        email: tenant.email,
      });
    } else {
      doc.text("Tenant details not provided.").moveDown(0.5);
    }

    // ─── Property ─────────────────────────────────────────────────────────────
    doc.moveDown(0.3);
    sectionHeading(doc, "PROPERTY DETAILS");
    if (property) {
      kvLine(doc, "Type", property.type);
      if (property.bhk && property.bhk !== "—") kvLine(doc, "Configuration", property.bhk);
      if (property.furnishing) kvLine(doc, "Furnishing", property.furnishing);
      kvLine(
        doc,
        "Address",
        [
          property.flatNumber,
          property.buildingName,
          property.addressLine1,
          property.addressLine2,
          property.locality,
          property.city,
          property.state,
          property.pincode,
        ]
          .filter(Boolean)
          .join(", "),
      );
      kvLine(doc, "Carpet Area", `${property.carpetArea} sq.ft.`);
      if (property.amenities?.length) {
        kvLine(doc, "Amenities", property.amenities.join(", "));
      }
    }

    // ─── Terms ────────────────────────────────────────────────────────────────
    doc.moveDown(0.3);
    sectionHeading(doc, "RENTAL TERMS");
    if (terms) {
      kvLine(doc, "Monthly Rent", `₹${terms.monthlyRent.toLocaleString("en-IN")}`);
      kvLine(doc, "Security Deposit", `₹${terms.securityDeposit.toLocaleString("en-IN")}`);
      kvLine(doc, "Duration", `${terms.durationMonths} months`);
      kvLine(doc, "Start Date", terms.startDate);
      kvLine(doc, "Notice Period", `${terms.noticePeriodMonths} month(s)`);
      if (terms.lockInMonths) kvLine(doc, "Lock-in Period", `${terms.lockInMonths} month(s)`);
      kvLine(doc, "Rent Due By", `${terms.rentDueDay}th of each month`);
      kvLine(doc, "Payment Mode", terms.paymentMode);
      if (terms.incrementPercent) {
        kvLine(doc, "Annual Increment", `${terms.incrementPercent}%`);
      }
    }

    // ─── Clauses ──────────────────────────────────────────────────────────────
    const clauseList = (clauses as ClausesData | null)?.clauses?.filter(
      (c) => c.enabled,
    );
    if (clauseList?.length) {
      doc.moveDown(0.3);
      sectionHeading(doc, "TERMS AND CONDITIONS");
      clauseList.forEach((clause, i) => {
        doc
          .font("Helvetica-Bold")
          .fontSize(10)
          .text(`${i + 1}. ${clause.label}`, { continued: false })
          .font("Helvetica")
          .fontSize(10)
          .text(clause.text, { indent: 16 })
          .moveDown(0.4);
      });
    }

    // ─── Signature block ──────────────────────────────────────────────────────
    doc.moveDown(0.5);
    sectionHeading(doc, "SIGNATURES");
    doc
      .font("Helvetica")
      .fontSize(10)
      .text(
        "The parties have read and agreed to the above terms and affix their signatures below:",
      )
      .moveDown(1);

    // Two-column signature block
    const sigY = doc.y;
    const colW = pageW / 2;

    doc
      .font("Helvetica-Bold")
      .text("Owner / Landlord (First Party)", 60, sigY)
      .font("Helvetica")
      .text(owner?.fullName ?? "___________________________", 60, sigY + 14)
      .text("Aadhaar: XXXX XXXX " + (owner?.aadhaarLast4 ?? "____"), 60, sigY + 28)
      .text("Date: _______________", 60, sigY + 42)
      .text("Signature: ___________________", 60, sigY + 64);

    const col2X = 60 + colW + 20;
    doc
      .font("Helvetica-Bold")
      .text("Tenant (Second Party)", col2X, sigY)
      .font("Helvetica")
      .text(tenant?.fullName ?? "___________________________", col2X, sigY + 14)
      .text("Aadhaar: XXXX XXXX " + (tenant?.aadhaarLast4 ?? "____"), col2X, sigY + 28)
      .text("Date: _______________", col2X, sigY + 42)
      .text("Signature: ___________________", col2X, sigY + 64);

    // ─── Witnesses ───────────────────────────────────────────────────────────
    const witList = (witnesses as WitnessesData | null)?.witnesses?.filter(
      (w) => w.fullName,
    );
    if (witList?.length) {
      doc.moveDown(4);
      sectionHeading(doc, "WITNESSES");
      witList.forEach((w, i) => {
        doc
          .font("Helvetica-Bold")
          .fontSize(10)
          .text(`Witness ${i + 1}: ${w.fullName}`)
          .font("Helvetica")
          .text(`Address: ${w.address ?? "—"}`)
          .text(`Phone: ${w.phone ?? "—"}`)
          .moveDown(0.5);
      });
    }

    doc.end();
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sectionHeading(doc: PDFKit.PDFDocument, text: string) {
  doc
    .font("Helvetica-Bold")
    .fontSize(12)
    .text(text.toUpperCase())
    .moveDown(0.2)
    .moveTo(60, doc.y)
    .lineTo(doc.page.width - 60, doc.y)
    .stroke()
    .moveDown(0.4);
}

function partyBlock(
  doc: PDFKit.PDFDocument,
  p: {
    name: string;
    fatherName?: string;
    age?: number;
    gender?: string;
    pan?: string;
    aadhaarLast4?: string;
    address: string;
    city: string;
    state: string;
    phone: string;
    email: string;
  },
) {
  kvLine(doc, "Name", p.name);
  if (p.fatherName) kvLine(doc, "Father / Husband", p.fatherName);
  if (p.age) kvLine(doc, "Age", String(p.age));
  if (p.gender) kvLine(doc, "Gender", p.gender);
  if (p.pan) kvLine(doc, "PAN", p.pan);
  if (p.aadhaarLast4)
    kvLine(doc, "Aadhaar", `XXXX XXXX ${p.aadhaarLast4}`);
  kvLine(doc, "Address", `${p.address}, ${p.city}, ${p.state}`);
  kvLine(doc, "Phone", p.phone);
  kvLine(doc, "Email", p.email);
  doc.moveDown(0.3);
}

function kvLine(doc: PDFKit.PDFDocument, key: string, value: string) {
  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .text(`${key}: `, { continued: true })
    .font("Helvetica")
    .text(value ?? "—")
    .moveDown(0.15);
}
