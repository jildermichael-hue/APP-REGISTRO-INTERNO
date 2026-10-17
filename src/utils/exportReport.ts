import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import {
  ComplianceAlert,
  MonthlySignature,
  ProjectMetadata,
  WasteRecord,
} from '../types/waste';
import { formatMonthLabel } from './complianceEngine';

export async function exportOfficialPdf(
  records: WasteRecord[],
  project: ProjectMetadata,
  selectedMonth: string,
  signature?: MonthlySignature,
  alerts: ComplianceAlert[] = []
): Promise<void> {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Official Title matching the uploaded reference format
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(
    'REGISTRO INTERNO DEL MANEJO DE RESIDUOS SÓLIDOS DE LA CONSTRUCCIÓN Y DEMOLICIÓN',
    pageWidth / 2,
    15,
    { align: 'center' }
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Conforme al D.L. N° 1278, D.S. N° 014-2017-MINAM y D.S. N° 002-2022-VIVIENDA  |  Periodo de Fiscalización: ${formatMonthLabel(selectedMonth)}`,
    pageWidth / 2,
    20.5,
    { align: 'center' }
  );

  // Project Header Box (Exact 4 fields from user's image + regulatory metadata)
  const startY = 25;
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.rect(14, startY, pageWidth - 28, 25);

  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);

  // Left column of metadata (Exact 4 labels from the user's screenshot)
  doc.setFont('helvetica', 'bold');
  doc.text('Nombre del proyecto:', 17, startY + 6);
  doc.text('Titular del proyecto:', 17, startY + 11.5);
  doc.text('Empresa que registra:', 17, startY + 17);
  doc.text('Responsable del registro:', 17, startY + 22.5);

  doc.setFont('helvetica', 'normal');
  doc.text(project.nombreProyecto, 62, startY + 6);
  doc.text(project.titularProyecto, 62, startY + 11.5);
  doc.text(project.empresaQueRegistra, 62, startY + 17);
  doc.text(
    `${project.responsableRegistro} (${project.cargoResponsable} - ${project.cipDni})`,
    62,
    startY + 22.5
  );

  // Right column of metadata
  doc.setFont('helvetica', 'bold');
  doc.text('IGA / Expediente:', 195, startY + 6);
  doc.text('Ubicación:', 195, startY + 11.5);
  doc.text('Estado de Firma:', 195, startY + 17);
  doc.text('Fecha de Emisión:', 195, startY + 22.5);

  doc.setFont('helvetica', 'normal');
  doc.text(project.expedienteAmbiental.slice(0, 42), 226, startY + 6);
  doc.text(project.ubicacionObra.slice(0, 42), 226, startY + 11.5);
  doc.text(
    signature ? `FIRMADO (${signature.verificationHash.slice(0, 18)})` : 'PENDIENTE DE FIRMA MENSUAL',
    226,
    startY + 17
  );
  doc.text(new Date().toISOString().slice(0, 10), 226, startY + 22.5);

  // Table matching the exact 8 columns from the user's screenshot
  const tableRows = records.map((rec, idx) => [
    String(idx + 1).padStart(2, '0'),
    rec.fecha,
    rec.nombreResiduo,
    rec.tipoResiduo,
    `${rec.volumenM3.toFixed(2)} m³`,
    `${rec.pesoKg.toLocaleString('es-PE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg\n(${(rec.pesoKg / 1000).toFixed(2)} t)`,
    rec.nroManifiestoGuia
      ? `${rec.eorsTransporta}\n[Guía/Manif: ${rec.nroManifiestoGuia}]`
      : rec.eorsTransporta,
    `${rec.eorsDisposicionFinal}\n[${rec.estadoEvacuacion}]`,
  ]);

  const totalVolume = records.reduce((sum, r) => sum + r.volumenM3, 0);
  const totalWeightKg = records.reduce((sum, r) => sum + r.pesoKg, 0);

  tableRows.push([
    '',
    'TOTAL',
    `Total del Periodo (${records.length} partidas registradas)`,
    '—',
    `${totalVolume.toFixed(2)} m³`,
    `${totalWeightKg.toLocaleString('es-PE', { minimumFractionDigits: 1 })} kg (${(totalWeightKg / 1000).toFixed(2)} t)`,
    '—',
    '—',
  ]);

  autoTable(doc, {
    startY: 54,
    head: [
      [
        'Ítem',
        'Fecha',
        'Nombre de residuo',
        'Tipo de Residuo',
        'Volumen',
        'Peso',
        'EO-RS Transporta',
        'EO-RS de Disposición Final o Proyecto de Valorización',
      ],
    ],
    body: tableRows,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 7.5,
      cellPadding: 2.2,
      lineColor: [30, 41, 59],
      lineWidth: 0.2,
      textColor: [15, 23, 42],
      valign: 'middle',
    },
    headStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      halign: 'center',
      lineColor: [30, 41, 59],
      lineWidth: 0.25,
    },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 21, halign: 'center' },
      2: { cellWidth: 52 },
      3: { cellWidth: 34, halign: 'center' },
      4: { cellWidth: 22, halign: 'right' },
      5: { cellWidth: 27, halign: 'right' },
      6: { cellWidth: 48 },
      7: { cellWidth: 53 },
    },
    didParseCell: (data) => {
      if (data.row.index === tableRows.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [248, 250, 252];
      }
    },
  });

  // Get Y position after table
  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  const neededHeight = 42;
  let blockY = finalY;

  if (blockY + neededHeight > pageHeight - 10) {
    doc.addPage();
    blockY = 20;
  }

  // Summary & Digital Signature Block at bottom
  doc.setDrawColor(203, 213, 225);
  doc.rect(14, blockY, 165, 34);

  const hazardousKg = records
    .filter((r) => r.tipoResiduo.startsWith('Peligroso'))
    .reduce((s, r) => s + r.pesoKg, 0);
  const valorizedKg = records
    .filter((r) => r.tipoResiduo.includes('Aprovechable'))
    .reduce((s, r) => s + r.pesoKg, 0);
  const valorizedPct = totalWeightKg > 0 ? (valorizedKg / totalWeightKg) * 100 : 0;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('RESUMEN DE FISCALIZACIÓN Y CUMPLIMIENTO NORMATIVO:', 18, blockY + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(
    `• Total Residuos Generados: ${(totalWeightKg / 1000).toFixed(2)} toneladas (${totalVolume.toFixed(2)} m³)`,
    18,
    blockY + 12
  );
  doc.text(
    `• Residuos Valorizados / Aprovechables: ${(valorizedKg / 1000).toFixed(2)} t (${valorizedPct.toFixed(1)}% vs Meta PMA ${project.metaValorizacionPct}%)`,
    18,
    blockY + 17.5
  );
  doc.text(
    `• Residuos Peligrosos Controlados: ${hazardousKg.toLocaleString('es-PE')} kg (${((hazardousKg / (totalWeightKg || 1)) * 100).toFixed(1)}% del total)`,
    18,
    blockY + 23
  );
  doc.text(
    `• Estado de Alertas Legales: ${
      alerts.length === 0
        ? '0 alertas pendientes (100% Conforme para Fiscalización)'
        : `${alerts.length} observación(es) registrada(s)`
    }`,
    18,
    blockY + 28.5
  );

  // Digital signature box on the right
  doc.rect(185, blockY, 98, 34);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('CONFORMIDAD Y FIRMA DIGITAL DEL RESPONSABLE', 234, blockY + 5.5, {
    align: 'center',
  });

  if (signature && signature.signatureDataUrl.startsWith('data:image/png')) {
    try {
      doc.addImage(signature.signatureDataUrl, 'PNG', 209, blockY + 7, 50, 15);
    } catch {
      // Fallback text if image fails
    }
  }

  doc.setLineWidth(0.25);
  doc.line(195, blockY + 23, 273, blockY + 23);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text(
    signature ? signature.signedBy : project.responsableRegistro,
    234,
    blockY + 27,
    { align: 'center' }
  );
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(
    signature
      ? `${signature.role} | ${signature.cipDni} | Hash: ${signature.verificationHash}`
      : `${project.cargoResponsable} — Pendiente de Firma Digital`,
    234,
    blockY + 31.5,
    { align: 'center' }
  );

  const cleanPeriod = selectedMonth === 'ALL' ? 'Acumulado_Anual' : selectedMonth;
  doc.save(`Registro_Interno_Residuos_${cleanPeriod}.pdf`);
}

export function exportOfficialExcel(
  records: WasteRecord[],
  project: ProjectMetadata,
  selectedMonth: string,
  signature?: MonthlySignature,
  alerts: ComplianceAlert[] = []
): void {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Exact Official Registry Format
  const sheetData: (string | number)[][] = [
    ['REGISTRO INTERNO DEL MANEJO DE RESIDUOS SÓLIDOS DE LA CONSTRUCCIÓN Y DEMOLICIÓN'],
    ['Normativa: D.L. N° 1278, D.S. N° 014-2017-MINAM y D.S. N° 002-2022-VIVIENDA'],
    [],
    ['Nombre del proyecto:', project.nombreProyecto, '', '', 'Ubicación de Obra:', project.ubicacionObra],
    ['Titular del proyecto:', project.titularProyecto, '', '', 'Expediente Ambiental:', project.expedienteAmbiental],
    ['Empresa que registra:', project.empresaQueRegistra, '', '', 'Periodo Reportado:', formatMonthLabel(selectedMonth)],
    [
      'Responsable del registro:',
      `${project.responsableRegistro} (${project.cipDni})`,
      '',
      '',
      'Estado Firma Digital:',
      signature ? `FIRMADO (${signature.verificationHash})` : 'PENDIENTE DE FIRMA',
    ],
    [],
    [
      'Ítem',
      'Fecha',
      'Nombre de residuo',
      'Tipo de Residuo',
      'Volumen (m³)',
      'Peso (kg)',
      'Peso (t)',
      'EO-RS Transporta',
      'EO-RS de Disposición Final o Proyecto de Valorización',
      'N° Guía / Manifiesto SIGERSOL',
      'Estado de Evacuación',
      'Frente de Trabajo',
      'Observaciones',
    ],
  ];

  records.forEach((rec, idx) => {
    sheetData.push([
      idx + 1,
      rec.fecha,
      rec.nombreResiduo,
      rec.tipoResiduo,
      Number(rec.volumenM3.toFixed(2)),
      Number(rec.pesoKg.toFixed(2)),
      Number((rec.pesoKg / 1000).toFixed(3)),
      rec.eorsTransporta,
      rec.eorsDisposicionFinal,
      rec.nroManifiestoGuia || 'SIN MANIFIESTO',
      rec.estadoEvacuacion,
      rec.frenteTrabajo || 'General',
      rec.observaciones || '',
    ]);
  });

  const totalVolume = records.reduce((s, r) => s + r.volumenM3, 0);
  const totalWeightKg = records.reduce((s, r) => s + r.pesoKg, 0);

  sheetData.push([]);
  sheetData.push([
    '',
    'TOTAL PERIODO',
    `${records.length} registros`,
    '',
    Number(totalVolume.toFixed(2)),
    Number(totalWeightKg.toFixed(2)),
    Number((totalWeightKg / 1000).toFixed(3)),
    '',
    '',
    '',
    '',
    '',
    '',
  ]);

  const wsRegistry = XLSX.utils.aoa_to_sheet(sheetData);
  wsRegistry['!cols'] = [
    { wch: 8 },
    { wch: 13 },
    { wch: 46 },
    { wch: 28 },
    { wch: 14 },
    { wch: 14 },
    { wch: 12 },
    { wch: 42 },
    { wch: 46 },
    { wch: 24 },
    { wch: 24 },
    { wch: 28 },
    { wch: 35 },
  ];

  XLSX.utils.book_append_sheet(wb, wsRegistry, 'Registro_Interno_RCD');

  // Sheet 2: KPIs & Fiscalización Summary
  const valorizedKg = records
    .filter((r) => r.tipoResiduo.includes('Aprovechable'))
    .reduce((s, r) => s + r.pesoKg, 0);
  const nonValorizedKg = records
    .filter((r) => r.tipoResiduo.includes('No Aprovechable'))
    .reduce((s, r) => s + r.pesoKg, 0);
  const hazardousKg = records
    .filter((r) => r.tipoResiduo.startsWith('Peligroso'))
    .reduce((s, r) => s + r.pesoKg, 0);

  const summaryRows: (string | number)[][] = [
    ['RESUMEN EJECUTIVO PARA FISCALIZACIÓN AMBIENTAL (OEFA / MVCS / SENACE)'],
    ['Proyecto:', project.nombreProyecto],
    ['Periodo:', formatMonthLabel(selectedMonth)],
    [],
    ['Indicador de Gestión de Residuos Sólidos', 'Valor', 'Unidad', 'Referencia Normativa'],
    ['Volumen Total Generado', Number(totalVolume.toFixed(2)), 'm³', 'Art. 55° D.L. N° 1278'],
    ['Peso Total Generado', Number(totalWeightKg.toFixed(2)), 'kg', 'Art. 55° D.L. N° 1278'],
    ['Peso Total en Toneladas', Number((totalWeightKg / 1000).toFixed(3)), 't', 'SIGERSOL No Municipal'],
    ['Residuos Aprovechables / Valorizados', Number(valorizedKg.toFixed(2)), 'kg', 'D.S. N° 002-2022-VIVIENDA'],
    [
      'Tasa de Valorización Alcanzada',
      totalWeightKg > 0 ? Number(((valorizedKg / totalWeightKg) * 100).toFixed(2)) : 0,
      '%',
      `Meta PMA: ${project.metaValorizacionPct}%`,
    ],
    ['Residuos No Aprovechables (Disposición Final)', Number(nonValorizedKg.toFixed(2)), 'kg', 'Escombrera / Relleno Sanitario'],
    ['Residuos Peligrosos Generados', Number(hazardousKg.toFixed(2)), 'kg', 'Manifiesto de Residuos Peligrosos'],
    ['Alertas de Incumplimiento Activas', alerts.length, 'alertas', 'Auditoría Preventiva'],
    [],
    ['DETALLE DE ALERTAS NORMATIVAS DETECTADAS'],
    ['Severidad', 'Normativa', 'Título de Alerta', 'Riesgo de Sanción'],
    ...alerts.map((a) => [a.severity, a.normativaRef, a.title, a.sanctionRisk]),
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  wsSummary['!cols'] = [{ wch: 42 }, { wch: 28 }, { wch: 48 }, { wch: 38 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen_Fiscalizacion');

  const cleanPeriod = selectedMonth === 'ALL' ? 'Acumulado_Anual' : selectedMonth;
  XLSX.writeFile(wb, `Registro_Interno_Residuos_${cleanPeriod}.xlsx`);
}
