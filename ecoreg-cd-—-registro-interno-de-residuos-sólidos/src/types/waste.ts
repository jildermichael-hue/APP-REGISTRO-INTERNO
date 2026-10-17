export type WasteCategory =
  | 'No Peligroso - Aprovechable'
  | 'No Peligroso - No Aprovechable'
  | 'Peligroso - Aprovechable'
  | 'Peligroso - No Aprovechable';

export type EvacuationStatus =
  | 'Evacuado con Certificado'
  | 'En Tránsito (EO-RS)'
  | 'Acopio Temporal en Obra';

export interface ProjectMetadata {
  nombreProyecto: string;
  titularProyecto: string;
  empresaQueRegistra: string;
  responsableRegistro: string;
  cargoResponsable: string;
  cipDni: string;
  ubicacionObra: string;
  expedienteAmbiental: string;
  metaValorizacionPct: number;
}

export interface WasteRecord {
  id: string;
  fecha: string; // YYYY-MM-DD
  nombreResiduo: string;
  tipoResiduo: WasteCategory;
  volumenM3: number;
  pesoKg: number;
  eorsTransporta: string;
  eorsDisposicionFinal: string;
  nroManifiestoGuia: string;
  certificadoDisposicion: boolean;
  estadoEvacuacion: EvacuationStatus;
  frenteTrabajo?: string;
  observaciones?: string;
}

export interface EorsProvider {
  id: string;
  razonSocial: string;
  ruc: string;
  registroMinam: string;
  tipoServicio: 'Transporte' | 'Disposición Final / Escombrera' | 'Planta de Valorización' | 'Integral (Transporte y Disposición)';
  autorizadoPeligrosos: boolean;
  vigenciaHasta: string; // YYYY-MM-DD
  infraestructuraDestino?: string;
}

export interface MonthlySignature {
  month: string; // YYYY-MM
  signedBy: string;
  role: string;
  cipDni: string;
  signedAt: string; // ISO string
  signatureDataUrl: string;
  verificationHash: string;
  observacionesCierre?: string;
}

export interface ComplianceAlert {
  id: string;
  severity: 'Crítico' | 'Advertencia' | 'Informativo';
  normativaRef: string;
  title: string;
  description: string;
  sanctionRisk: string;
  affectedRecordIds: string[];
  actionLabel: string;
  actionType: 'sign_month' | 'edit_record' | 'evacuate_records' | 'view_filtered';
}

export interface WasteCatalogTemplate {
  nombreResiduo: string;
  tipoResiduo: WasteCategory;
  densidadKgM3: number;
  colorNtp: string;
  destinoSugerido: string;
}
