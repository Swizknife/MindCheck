import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { ScreeningResult, SessionWithResults } from "@workspace/api-client-react";

export function generateReportPdf(session: SessionWithResults) {
  if (!session.results) return;
  const results = session.results as unknown as ScreeningResult;

  const doc = new jsPDF();

  doc.setFontSize(22);
  doc.setTextColor(240, 120, 100); // Primary color
  doc.text("MindCheck Screening Report", 14, 22);

  doc.setFontSize(12);
  doc.setTextColor(50, 50, 50);
  doc.text(`Name: ${session.name}`, 14, 32);
  if (session.age) doc.text(`Age: ${session.age}`, 14, 40);
  if (session.email) doc.text(`Email: ${session.email}`, 14, 48);

  doc.text(`Overall Risk Level: ${results.riskLevel} (${results.overallRisk})`, 14, 60);
  
  if (results.safetyAlert) {
    doc.setTextColor(220, 50, 50);
    doc.setFont("helvetica", "bold");
    doc.text("CRITICAL SAFETY ALERT TRIGGERED", 14, 70);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(50, 50, 50);
  }

  const tableData = results.modules.map(m => [
    m.name,
    `${m.score} / ${m.maxScore}`,
    `${Math.round(m.riskPercent)}%`,
    m.riskLevel
  ]);

  autoTable(doc, {
    startY: results.safetyAlert ? 80 : 70,
    head: [['Module', 'Score', 'Risk %', 'Level']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [240, 120, 100] }
  });

  const finalY = (doc as any).lastAutoTable.finalY || 100;
  
  doc.text("Recommendations:", 14, finalY + 10);
  let y = finalY + 20;
  results.recommendations.forEach(rec => {
    doc.text(`• ${rec}`, 14, y);
    y += 8;
  });

  doc.save(`mindcheck_report_${session.id}.pdf`);
}
