import React, { useState } from 'react';
import {
  CheckCircle2,
  Edit3,
  FileDown,
  FileSpreadsheet,
  PenTool,
  Printer,
  Save,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import {
  ComplianceAlert,
  MonthlySignature,
  ProjectMetadata,
  WasteRecord,
} from '../types/waste';
import { formatMonthLabel } from '../utils/complianceEngine';

interface OfficialRegistryFormatViewProps {
  records: WasteRecord[];
  project: ProjectMetadata;
  onUpdateProject: (updated: ProjectMetadata) => void;
  selectedMonth: string;
  signature?: MonthlySignature;
  onOpenSignatureModal: () => void;
  onExportPdf: () => void;
  onExportExcel: () => void;
  alerts: ComplianceAlert[];
}

export const OfficialRegistryFormatView: React.FC<OfficialRegistryFormatViewProps> = ({
  records,
  project,
  onUpdateProject,
  selectedMonth,
  signature,
  onOpenSignatureModal,
  onExportPdf,
  onExportExcel,
  alerts,
}) => {
  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const [draftProject, setDraftProject] = useState<ProjectMetadata>(project);

  const totalVolume = records.reduce((s, r) => s + r.volumenM3, 0);
  const totalWeightKg = records.reduce((s, r) => s + r.pesoKg, 0);

  const handleSaveHeader = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProject(draftProject);
    setIsEditingHeader(false);
  };

  return (
    <div className="space-y-6">
      {/* Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 no-print">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Formato Oficial de Fiscalización (Modelo Normativo RCD)
          </h2>
          <p className="text-xs text-slate-500">
            Vista exacta del documento oficial con cabecera del proyecto, tabla de 8 columnas y bloque de firma digital verificable.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setDraftProject(project);
              setIsEditingHeader(!isEditingHeader);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0"
          >
            <Edit3 className="h-3.5 w-3.5" />
            {isEditingHeader ? 'Cancelar Edición' : 'Editar Datos del Proyecto'}
          </button>

          <button
            type="button"
            onClick={onOpenSignatureModal}
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-700 bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 whitespace-nowrap shrink-0"
          >
            <PenTool className="h-3.5 w-3.5" />
            {signature ? 'Actualizar Firma Digital' : 'Firmar Digitalmente'}
          </button>

          <button
            type="button"
            onClick={onExportPdf}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800 whitespace-nowrap shrink-0"
          >
            <FileDown className="h-3.5 w-3.5" />
            Exportar PDF Oficial
          </button>

          <button
            type="button"
            onClick={onExportExcel}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-800 whitespace-nowrap shrink-0"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            Exportar Excel (.xlsx)
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0"
          >
            <Printer className="h-3.5 w-3.5" />
            Imprimir
          </button>
        </div>
      </div>

      {/* Inline Editor for Project Metadata if active */}
      {isEditingHeader && (
        <form
          onSubmit={handleSaveHeader}
          className="rounded-xl border border-slate-300 bg-white p-5 space-y-4 no-print"
        >
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h3 className="text-sm font-bold text-slate-900">
              Configuración de Cabecera del Registro Interno
            </h3>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800"
            >
              <Save className="h-3.5 w-3.5" />
              Guardar Cabecera
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nombre del proyecto:
              </label>
              <input
                type="text"
                required
                value={draftProject.nombreProyecto}
                onChange={(e) =>
                  setDraftProject({ ...draftProject, nombreProyecto: e.target.value })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Titular del proyecto:
              </label>
              <input
                type="text"
                required
                value={draftProject.titularProyecto}
                onChange={(e) =>
                  setDraftProject({ ...draftProject, titularProyecto: e.target.value })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Empresa que registra:
              </label>
              <input
                type="text"
                required
                value={draftProject.empresaQueRegistra}
                onChange={(e) =>
                  setDraftProject({
                    ...draftProject,
                    empresaQueRegistra: e.target.value,
                  })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Responsable del registro:
              </label>
              <input
                type="text"
                required
                value={draftProject.responsableRegistro}
                onChange={(e) =>
                  setDraftProject({
                    ...draftProject,
                    responsableRegistro: e.target.value,
                  })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
              />
            </div>
          </div>
        </form>
      )}

      {/* Official Document Sheet (Matches the attached reference image) */}
      <div className="rounded-xl border border-slate-300 bg-white p-8 shadow-xs">
        {/* Document Main Heading */}
        <div className="text-center mb-6">
          <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-950 uppercase">
            REGISTRO INTERNO DEL MANEJO DE RESIDUOS SÓLIDOS DE LA CONSTRUCCIÓN Y DEMOLICIÓN
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Periodo de Control: <span className="font-semibold text-slate-800">{formatMonthLabel(selectedMonth)}</span>
            {' · '}Expediente Ambiental: {project.expedienteAmbiental}
          </p>
        </div>

        {/* Exact 4 Header Metadata Rows from User Image */}
        <div className="mb-6 grid grid-cols-1 gap-y-2 border border-slate-300 bg-slate-50/50 p-4 text-sm lg:grid-cols-12">
          <div className="lg:col-span-8 space-y-1.5">
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
              <span className="font-bold text-slate-900 min-w-[185px]">Nombre del proyecto:</span>
              <span className="text-slate-800">{project.nombreProyecto}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
              <span className="font-bold text-slate-900 min-w-[185px]">Titular del proyecto:</span>
              <span className="text-slate-800">{project.titularProyecto}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
              <span className="font-bold text-slate-900 min-w-[185px]">Empresa que registra:</span>
              <span className="text-slate-800">{project.empresaQueRegistra}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
              <span className="font-bold text-slate-900 min-w-[185px]">Responsable del registro:</span>
              <span className="text-slate-800">
                {project.responsableRegistro} ({project.cargoResponsable} · {project.cipDni})
              </span>
            </div>
          </div>

          <div className="lg:col-span-4 border-t lg:border-t-0 lg:border-l border-slate-200 pt-3 lg:pt-0 lg:pl-4 flex flex-col justify-between text-xs text-slate-600">
            <div>
              <div className="font-semibold text-slate-900">Ubicación de Obra:</div>
              <div>{project.ubicacionObra}</div>
            </div>
            <div className="mt-2 flex items-center gap-1.5">
              {signature ? (
                <>
                  <ShieldCheck className="h-4 w-4 text-emerald-700 shrink-0" />
                  <span className="font-mono font-semibold text-emerald-800">
                    FIRMADO: {signature.verificationHash}
                  </span>
                </>
              ) : (
                <>
                  <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0" />
                  <span className="font-medium text-amber-800">
                    Pendiente de Firma Digital de Cierre Mensual
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Exact 8-Column Official Table matching the screenshot */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-slate-800 text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-950">
                <th className="border border-slate-800 px-2.5 py-3 text-center font-bold w-12">
                  Ítem
                </th>
                <th className="border border-slate-800 px-3 py-3 text-center font-bold w-24">
                  Fecha
                </th>
                <th className="border border-slate-800 px-3 py-3 text-center font-bold">
                  Nombre de residuo
                </th>
                <th className="border border-slate-800 px-3 py-3 text-center font-bold w-40">
                  Tipo de Residuo
                </th>
                <th className="border border-slate-800 px-3 py-3 text-center font-bold w-24">
                  Volumen
                </th>
                <th className="border border-slate-800 px-3 py-3 text-center font-bold w-28">
                  Peso
                </th>
                <th className="border border-slate-800 px-3 py-3 text-center font-bold">
                  EO-RS Transporta
                </th>
                <th className="border border-slate-800 px-3 py-3 text-center font-bold">
                  EO-RS de Disposición Final o Proyecto de Valorización
                </th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="border border-slate-800 px-4 py-8 text-center text-slate-500"
                  >
                    No existen registros para el filtro seleccionado.
                  </td>
                </tr>
              ) : (
                records.map((rec, index) => (
                  <tr key={rec.id} className="hover:bg-slate-50">
                    <td className="border border-slate-800 px-2.5 py-2.5 text-center font-mono tabular-nums text-slate-900">
                      {String(index + 1).padStart(2, '0')}
                    </td>
                    <td className="border border-slate-800 px-3 py-2.5 text-center font-mono tabular-nums text-slate-900 whitespace-nowrap">
                      {rec.fecha}
                    </td>
                    <td className="border border-slate-800 px-3 py-2.5 text-slate-900 font-medium">
                      <div>{rec.nombreResiduo}</div>
                      {rec.frenteTrabajo && (
                        <div className="text-[11px] font-normal text-slate-500 mt-0.5">
                          Frente: {rec.frenteTrabajo}
                        </div>
                      )}
                    </td>
                    <td className="border border-slate-800 px-3 py-2.5 text-center text-slate-800">
                      {rec.tipoResiduo}
                    </td>
                    <td className="border border-slate-800 px-3 py-2.5 text-right font-mono tabular-nums text-slate-900 whitespace-nowrap">
                      {rec.volumenM3.toFixed(2)} m³
                    </td>
                    <td className="border border-slate-800 px-3 py-2.5 text-right font-mono tabular-nums text-slate-900 whitespace-nowrap">
                      <div>
                        {rec.pesoKg.toLocaleString('es-PE', {
                          minimumFractionDigits: 1,
                          maximumFractionDigits: 1,
                        })}{' '}
                        kg
                      </div>
                      <div className="text-[11px] text-slate-500">
                        ({(rec.pesoKg / 1000).toFixed(2)} t)
                      </div>
                    </td>
                    <td className="border border-slate-800 px-3 py-2.5 text-slate-800">
                      <div>{rec.eorsTransporta}</div>
                      {rec.nroManifiestoGuia ? (
                        <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                          Guía/Manifiesto: {rec.nroManifiestoGuia}
                        </div>
                      ) : (
                        <div className="text-[11px] font-medium text-crimson-600 text-red-700 mt-0.5">
                          Sin Guía / Manifiesto registrado
                        </div>
                      )}
                    </td>
                    <td className="border border-slate-800 px-3 py-2.5 text-slate-800">
                      <div>{rec.eorsDisposicionFinal}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Estado: {rec.estadoEvacuacion}
                      </div>
                    </td>
                  </tr>
                ))
              )}

              {/* Totals Footer Row */}
              {records.length > 0 && (
                <tr className="bg-slate-100 font-bold text-slate-950">
                  <td
                    colSpan={4}
                    className="border border-slate-800 px-3 py-2.5 text-right uppercase"
                  >
                    Total Acumulado del Periodo ({records.length} partidas):
                  </td>
                  <td className="border border-slate-800 px-3 py-2.5 text-right font-mono tabular-nums whitespace-nowrap">
                    {totalVolume.toFixed(2)} m³
                  </td>
                  <td className="border border-slate-800 px-3 py-2.5 text-right font-mono tabular-nums whitespace-nowrap">
                    <div>
                      {totalWeightKg.toLocaleString('es-PE', {
                        minimumFractionDigits: 1,
                      })}{' '}
                      kg
                    </div>
                    <div className="text-[11px] font-normal text-slate-600">
                      ({(totalWeightKg / 1000).toFixed(2)} t)
                    </div>
                  </td>
                  <td colSpan={2} className="border border-slate-800 px-3 py-2.5 text-slate-600 font-normal">
                    Trazabilidad verificada conforme a D.S. N° 002-2022-VIVIENDA
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Official Footer: Compliance Summary & Digital Signature Seal */}
        <div className="mt-8 grid grid-cols-1 gap-6 pt-4 md:grid-cols-12 items-end">
          <div className="md:col-span-7 rounded-lg border border-slate-300 bg-slate-50 p-4 text-xs text-slate-700 space-y-1.5">
            <div className="font-bold text-slate-900 uppercase">
              Constancia de Verificación Normativa para Fiscalización Ambiental
            </div>
            <p>
              El presente Registro Interno se encuentra a disposición de la Autoridad Competente (OEFA / MVCS / SENACE) en cumplimiento del Artículo 55° del Decreto Legislativo N° 1278 y el Decreto Supremo N° 002-2022-VIVIENDA.
            </p>
            <div className="pt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-600 font-mono">
              <span>Partidas registradas: {records.length}</span>
              <span>·</span>
              <span>Volumen total: {totalVolume.toFixed(2)} m³</span>
              <span>·</span>
              <span>Masa total: {(totalWeightKg / 1000).toFixed(2)} t</span>
              <span>·</span>
              <span>
                Alertas pendientes: {alerts.length}
              </span>
            </div>
          </div>

          <div className="md:col-span-5 flex flex-col items-center justify-center rounded-lg border border-slate-300 bg-white p-4 text-center">
            {signature ? (
              <>
                <img
                  src={signature.signatureDataUrl}
                  alt={`Firma digital de ${signature.signedBy}`}
                  referrerPolicy="no-referrer"
                  className="h-20 object-contain mb-1"
                />
                <div className="w-64 border-t border-slate-800 pt-1.5">
                  <div className="text-xs font-bold text-slate-900">
                    {signature.signedBy}
                  </div>
                  <div className="text-[11px] text-slate-600">
                    {signature.role} · {signature.cipDni}
                  </div>
                  <div className="mt-1 flex items-center justify-center gap-1 text-[10px] font-mono text-emerald-800">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>{signature.verificationHash}</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="py-3 space-y-2">
                <p className="text-xs font-medium text-amber-800">
                  Registro sin firma digital de cierre en este periodo
                </p>
                <button
                  type="button"
                  onClick={onOpenSignatureModal}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800 no-print"
                >
                  <PenTool className="h-3.5 w-3.5" />
                  Firmar Digitalmente Ahora
                </button>
                <div className="w-60 border-t border-slate-400 pt-1.5 mx-auto">
                  <div className="text-xs font-bold text-slate-700">
                    {project.responsableRegistro}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Responsable del Registro ({project.cipDni})
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
