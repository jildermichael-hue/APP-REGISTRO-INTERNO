import {
  ComplianceAlert,
  MonthlySignature,
  ProjectMetadata,
  WasteRecord,
} from '../types/waste';

export function evaluateComplianceAlerts(
  records: WasteRecord[],
  selectedMonth: string, // 'ALL' or 'YYYY-MM'
  signatures: Record<string, MonthlySignature>,
  project: ProjectMetadata
): ComplianceAlert[] {
  const alerts: ComplianceAlert[] = [];

  // 1. Check hazardous waste without Manifest or without Authorized EO-RS
  const hazardousWithoutManifest = records.filter(
    (r) =>
      r.tipoResiduo.startsWith('Peligroso') &&
      (!r.nroManifiestoGuia || r.nroManifiestoGuia.trim() === '')
  );

  if (hazardousWithoutManifest.length > 0) {
    alerts.push({
      id: 'alert-hazardous-manifest',
      severity: 'Crítico',
      normativaRef: 'Art. 56° y 58° D.S. N° 014-2017-MINAM / D.L. N° 1278',
      title: `${hazardousWithoutManifest.length} registro(s) de Residuos Peligrosos sin Manifiesto de Manejo (SIGERSOL)`,
      description:
        'Todo generador no municipal que evacúe residuos peligrosos debe contar con el Manifiesto de Manejo de Residuos Sólidos Peligrosos suscrito por la EO-RS autorizada y reportarlo en la plataforma SIGERSOL dentro de los primeros 15 días hábiles de cada trimestre.',
      sanctionRisk: 'Infracción Grave OEFA / Autoridad Sectorial (Multa de hasta 100 UIT)',
      affectedRecordIds: hazardousWithoutManifest.map((r) => r.id),
      actionLabel: 'Completar N° de Manifiesto',
      actionType: 'edit_record',
    });
  }

  // 2. Check records without assigned EO-RS Transporta or EO-RS Disposición Final
  const unassignedEors = records.filter(
    (r) =>
      !r.eorsTransporta ||
      r.eorsTransporta.toLowerCase().includes('pendiente') ||
      !r.eorsDisposicionFinal ||
      r.eorsDisposicionFinal.toLowerCase().includes('pendiente')
  );

  if (unassignedEors.length > 0) {
    alerts.push({
      id: 'alert-unassigned-eors',
      severity: 'Crítico',
      normativaRef: 'Art. 35° D.S. N° 002-2022-VIVIENDA / Art. 48° D.S. 014-2017-MINAM',
      title: `${unassignedEors.length} partida(s) sin EO-RS de Transporte o Disposición Final acreditada`,
      description:
        'La evacuación fuera de obra debe realizarse exclusivamente mediante Empresas Operadoras de Residuos Sólidos (EO-RS) debidamente inscritas en el registro autoritativo del MINAM.',
      sanctionRisk: 'Infracción Muy Grave por entrega a operadores no autorizados',
      affectedRecordIds: unassignedEors.map((r) => r.id),
      actionLabel: 'Asignar EO-RS Autorizada',
      actionType: 'edit_record',
    });
  }

  // 3. Check pending certificates or temporary storage in site
  const pendingEvacuation = records.filter(
    (r) => r.estadoEvacuacion !== 'Evacuado con Certificado' || !r.certificadoDisposicion
  );

  if (pendingEvacuation.length > 0) {
    alerts.push({
      id: 'alert-pending-certificates',
      severity: 'Advertencia',
      normativaRef: 'Art. 32° D.S. N° 002-2022-VIVIENDA (Almacenamiento Temporal en Obra)',
      title: `${pendingEvacuation.length} registro(s) en acopio temporal o pendientes de Certificado de Disposición Final`,
      description:
        'Los residuos en acopio temporal en obra no deben superar el plazo máximo establecido en el IGA/PMA y requieren Certificado de Disposición Final o Valorización emitido por la EO-RS para cerrar la trazabilidad.',
      sanctionRisk: 'Observación en supervisión ambiental por trazabilidad incompleta',
      affectedRecordIds: pendingEvacuation.map((r) => r.id),
      actionLabel: 'Validar Certificados y Evacuación',
      actionType: 'evacuate_records',
    });
  }

  // 4. Check digital signature for the selected month
  if (selectedMonth !== 'ALL') {
    const monthSig = signatures[selectedMonth];
    if (!monthSig && records.length > 0) {
      alerts.push({
        id: 'alert-unsigned-month',
        severity: 'Advertencia',
        normativaRef: 'Art. 55° D.L. N° 1278 — Obligación de conducir Registro Interno validado',
        title: `El periodo ${selectedMonth} aún no cuenta con Firma Digital del Responsable`,
        description:
          'Para validez ante requerimiento de fiscalización (OEFA / MVCS / SENACE), el Registro Interno mensual debe encontrarse suscrito por el Responsable del Registro e Ingeniero Especialista Ambiental.',
        sanctionRisk: 'Incumplimiento formal por falta de suscripción del registro interno',
        affectedRecordIds: [],
        actionLabel: 'Firmar Registro del Mes',
        actionType: 'sign_month',
      });
    }
  } else {
    // Check if current month 2026-10 is unsigned
    const monthsPresent = Array.from(new Set(records.map((r) => r.fecha.slice(0, 7))));
    const unsignedMonths = monthsPresent.filter((m) => !signatures[m]);
    if (unsignedMonths.length > 0) {
      alerts.push({
        id: 'alert-unsigned-months-all',
        severity: 'Advertencia',
        normativaRef: 'Art. 55° D.L. N° 1278 — Conducción de Registro Interno de Residuos',
        title: `Periodo(s) sin Firma Digital de cierre: ${unsignedMonths.join(', ')}`,
        description:
          'Existen meses con movimientos registrados que aún no han sido firmados digitalmente por el Responsable del Registro para su presentación en fiscalización.',
        sanctionRisk: 'Observación formal en auditoría documentaria',
        affectedRecordIds: [],
        actionLabel: `Firmar Periodo ${unsignedMonths[0]}`,
        actionType: 'sign_month',
      });
    }
  }

  // 5. Check valorization rate vs PMA target
  if (records.length > 0) {
    const totalWeight = records.reduce((acc, r) => acc + r.pesoKg, 0);
    const valorizedWeight = records
      .filter((r) => r.tipoResiduo.includes('Aprovechable'))
      .reduce((acc, r) => acc + r.pesoKg, 0);
    const valorizationPct = totalWeight > 0 ? (valorizedWeight / totalWeight) * 100 : 0;

    if (valorizationPct < project.metaValorizacionPct) {
      alerts.push({
        id: 'alert-low-valorization',
        severity: 'Advertencia',
        normativaRef: 'Art. 25° D.S. N° 002-2022-VIVIENDA — Metas de Valorización RCD',
        title: `Tasa de valorización (${valorizationPct.toFixed(1)}%) inferior a la meta del PMA (${project.metaValorizacionPct}%)`,
        description:
          'El porcentaje de residuos sólidos de la construcción destinados a valorización (reutilización o reciclaje) se encuentra por debajo del compromiso asumido en el Instrumento de Gestión Ambiental.',
        sanctionRisk: 'Incumplimiento de compromiso del Plan de Manejo Ambiental (PMA)',
        affectedRecordIds: [],
        actionLabel: 'Revisar Partidas Aprovechables',
        actionType: 'view_filtered',
      });
    }
  }

  return alerts;
}

export function formatMonthLabel(yyyyMm: string): string {
  if (yyyyMm === 'ALL') return 'Todos los periodos (Acumulado Anual)';
  const [year, month] = yyyyMm.split('-');
  const monthNames = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ];
  const mIndex = parseInt(month, 10) - 1;
  return `${monthNames[mIndex] || month} ${year}`;
}
