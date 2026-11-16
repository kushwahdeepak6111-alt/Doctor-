import { jsPDF } from 'jspdf';
import type { AppointmentSlipData } from '../types/clinic';

export async function downloadAppointmentSlipPdf(slip: AppointmentSlipData): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const isReceipt = slip.documentType === 'request_receipt';
  const titleText = isReceipt
    ? 'APPOINTMENT REQUEST RECEIPT'
    : 'APPOINTMENT CONFIRMATION SLIP';
  const statusLabel =
    slip.status === 'pending'
      ? 'Pending Clinic Confirmation'
      : slip.status === 'confirmed'
        ? 'Confirmed Appointment'
        : 'Completed Consultation';

  // Header band
  doc.setFillColor(11, 45, 82); // #0B2D52
  doc.rect(0, 0, 210, 34, 'F');

  // Medical cross mark inside crisp white box
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(14, 8, 12, 12, 2, 2, 'F');
  doc.setFillColor(28, 126, 214); // #1C7ED6
  doc.rect(19, 10.5, 2, 7, 'F');
  doc.rect(16.5, 13, 7, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(slip.clinicName, 31, 14.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text(slip.clinicAddress, 31, 20.5);
  doc.text(`Tel: ${slip.clinicPhone}  |  Email: ${slip.clinicEmail}`, 31, 26);

  // Document type banner
  if (isReceipt) {
    doc.setFillColor(254, 243, 199); // Amber tint
    doc.setDrawColor(245, 158, 11);
  } else {
    doc.setFillColor(234, 243, 252); // Soft clinic blue
    doc.setDrawColor(28, 126, 214);
  }
  doc.roundedRect(14, 42, 182, 18, 2, 2, 'FD');

  doc.setTextColor(11, 45, 82);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(titleText, 20, 50);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    isReceipt
      ? 'Not yet confirmed — awaiting clinic reception schedule verification.'
      : 'Verified outpatient appointment record issued by Arogya Multi-Specialty Clinic.',
    20,
    56
  );

  // Reference & status box
  doc.setDrawColor(226, 234, 242);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 66, 182, 22, 2, 2, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(92, 111, 132);
  doc.text('BOOKING REFERENCE CODE', 20, 73.5);
  doc.text('CURRENT STATUS', 115, 73.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(11, 45, 82);
  doc.text(slip.referenceCode, 20, 82);
  doc.setFontSize(11);
  doc.text(statusLabel, 115, 82);

  // Details table
  const rows: Array<[string, string]> = [
    ['Patient Full Name', slip.patientName],
    [
      'Consulting Specialist',
      slip.doctorQualification
        ? `${slip.doctorName} (${slip.doctorQualification})`
        : slip.doctorName,
    ],
    ['Medical Department', slip.specializationName],
    ['Appointment Date', slip.date],
    ['Appointment Time', slip.timeSlot],
    ['Booking Submitted', new Date(slip.bookedAt).toLocaleString('en-IN')],
    ['Clinic OPD Hours', slip.clinicHours],
  ];

  let y = 98;
  doc.setFontSize(10);
  for (let i = 0; i < rows.length; i += 1) {
    const [label, value] = rows[i];
    const wrappedVal = doc.splitTextToSize(value || '', 114).slice(0, 2);
    const rowH = wrappedVal.length > 1 ? 15 : 11;
    if (i % 2 === 0) {
      doc.setFillColor(248, 251, 255);
      doc.rect(14, y - 5, 182, rowH, 'F');
    }
    doc.setDrawColor(226, 234, 242);
    doc.line(14, y + rowH - 5, 196, y + rowH - 5);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(92, 111, 132);
    doc.text(label, 18, y + 2);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(16, 35, 59);
    doc.text(wrappedVal, 78, y + 2);

    y += rowH + 1;
  }

  // Clinic notice section
  y += 8;
  doc.setFillColor(244, 248, 252);
  doc.setDrawColor(200, 218, 236);
  const noticeLines = doc.splitTextToSize(slip.clinicNotice, 170);
  const noticeBoxHeight = Math.max(24, 14 + noticeLines.length * 5);
  doc.roundedRect(14, y, 182, noticeBoxHeight, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(11, 45, 82);
  doc.text('Clinic Visit Instructions & Notice', 20, y + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(noticeLines, 20, y + 14.5);

  // Footer
  doc.setDrawColor(226, 234, 242);
  doc.line(14, 272, 196, 272);
  doc.setFontSize(8.5);
  doc.setTextColor(120, 134, 150);
  doc.text(
    `${slip.clinicName} • Official ${isReceipt ? 'Request Receipt' : 'Confirmation Slip'} • Confidential Patient Copy`,
    14,
    279
  );
  doc.text(`Generated ${new Date().toISOString().slice(0, 10)}`, 164, 279);

  const safePrefix = isReceipt ? 'request-receipt' : 'confirmation-slip';
  doc.save(`arogya-${safePrefix}-${slip.referenceCode}.pdf`);
}
