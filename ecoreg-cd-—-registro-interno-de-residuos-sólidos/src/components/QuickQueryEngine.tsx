import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  FileDown,
  FileSpreadsheet,
  Filter,
  Layers,
  Recycle,
  RotateCcw,
  Scale,
  Search,
  Sparkles,
  Truck,
} from 'lucide-react';
import { ProjectMetadata, WasteRecord } from '../types/waste';
import { formatMonthLabel } from '../utils/complianceEngine';

interface QuickQueryEngineProps {
  allRecords: WasteRecord[];
  project: ProjectMetadata;
  availableMonths: string[];
  onApplyToGlobalFilter: (month: string, category: string) => void;
  onExportQueryPdf: (records: WasteRecord[], periodLabel: string) => void;
  onExportQueryExcel: (records: WasteRecord[], periodLabel: string) => void;
}

interface PresetQuestion {
  id: string;
  label: string;
  month: string;
  category: string;
  residueKeyword: string;
  eorsKeyword: string;
}

const PRESET_QUESTIONS: PresetQuestion[] = [
  {
    id: 'q-oct',
    label: '¿Cuántos residuos generé en Octubre 2026?',
    month: '2026-10',
    category: 'ALL',
    residueKeyword: '',
    eorsKeyword: '',
  },
  {
    id: 'q-sep',
    label: '¿Cuántos residuos generé en Septiembre 2026?',
    month: '2026-09',
    category: 'ALL',
    residueKeyword: '',
    eorsKeyword: '',
  },
  {
    id: 'q-aug',
    label: '¿Cuántos residuos generé en Agosto 2026?',
    month: '2026-08',
    category: 'ALL',
    residueKeyword: '',
    eorsKeyword: '',
  },
  {
    id: 'q-haz',
    label: '¿Cuánto residuo peligroso generé en total?',
    month: 'ALL',
    category: 'PELIGROSOS_ALL',
    residueKeyword: '',
    eorsKeyword: '',
  },
  {
    id: 'q-val',
    label: '¿Cuánto concreto y desmonte se valorizó en el año?',
    month: 'ALL',
    category: 'No Peligroso - Aprovechable',
    residueKeyword: '',
    eorsKeyword: '',
  },
  {
    id: 'q-steel',
    label: '¿Cuánto acero y metal residual se recicló?',
    month: 'ALL',
    category: 'ALL',
    residueKeyword: 'acero',
    eorsKeyword: '',
  },
];

export const QuickQueryEngine: React.FC<QuickQueryEngineProps> = ({
  allRecords,
  project,
  availableMonths,
  onApplyToGlobalFilter,
  onExportQueryPdf,
  onExportQueryExcel,
}) => {
  const [queryMonth, setQueryMonth] = useState<string>('2026-10');
  const [queryCategory, setQueryCategory] = useState<string>('ALL');
  const [residueKeyword, setResidueKeyword] = useState<string>('');
  const [eorsKeyword, setEorsKeyword] = useState<string>('');
  const [naturalTextQuery, setNaturalTextQuery] = useState<string>('');
  const [activePresetId, setActivePresetId] = useState<string>('q-oct');

  // Parse natural language questions like "cuantos residuos genere en septiembre" or "peligrosos en octubre"
  const handleNaturalLanguageSearch = (text: string) => {
    setNaturalTextQuery(text);
    setActivePresetId('');
    const lower = text.toLowerCase();

    // Detect month in query
    if (lower.includes('octubre') || lower.includes('2026-10') || lower.includes('mes 10')) {
      setQueryMonth('2026-10');
    } else if (
      lower.includes('septiembre') ||
      lower.includes('setiembre') ||
      lower.includes('2026-09') ||
      lower.includes('mes 9')
    ) {
      setQueryMonth('2026-09');
    } else if (lower.includes('agosto') || lower.includes('2026-08') || lower.includes('mes 8')) {
      setQueryMonth('2026-08');
    } else if (lower.includes('total') || lower.includes('año') || lower.includes('anual') || lower.includes('todos')) {
      setQueryMonth('ALL');
    }

    // Detect category in query
    if (lower.includes('peligroso')) {
      setQueryCategory('PELIGROSOS_ALL');
    } else if (lower.includes('no aprovechable') || lower.includes('relleno')) {
      setQueryCategory('No Peligroso - No Aprovechable');
    } else if (lower.includes('aprovechable') || lower.includes('valoriz')) {
      setQueryCategory('No Peligroso - Aprovechable');
    } else {
      setQueryCategory('ALL');
    }

    // Detect specific material keywords
    const materialKeywords = [
      'concreto',
      'excavación',
      'acero',
      'madera',
      'cemento',
      'pintura',
      'hidrocarburo',
      'aceite',
    ];
    const foundMat = materialKeywords.find((k) => lower.includes(k));
    setResidueKeyword(foundMat || '');
  };

  const applyPreset = (preset: PresetQuestion) => {
    setActivePresetId(preset.id);
    setNaturalTextQuery(preset.label);
    setQueryMonth(preset.month);
    setQueryCategory(preset.category);
    setResidueKeyword(preset.residueKeyword);
    setEorsKeyword(preset.eorsKeyword);
  };

  // Compute immediate results from the data
  const matchingRecords = useMemo(() => {
    return allRecords.filter((r) => {
      if (queryMonth !== 'ALL' && !r.fecha.startsWith(queryMonth)) {
        return false;
      }
      if (queryCategory === 'PELIGROSOS_ALL') {
        if (!r.tipoResiduo.startsWith('Peligroso')) return false;
      } else if (queryCategory === 'APROVECHABLES_ALL') {
        if (!r.tipoResiduo.includes('Aprovechable')) return false;
      } else if (queryCategory !== 'ALL' && r.tipoResiduo !== queryCategory) {
        return false;
      }
      if (residueKeyword.trim() !== '') {
        const kw = residueKeyword.toLowerCase();
        if (
          !r.nombreResiduo.toLowerCase().includes(kw) &&
          !(r.frenteTrabajo && r.frenteTrabajo.toLowerCase().includes(kw))
        ) {
          return false;
        }
      }
      if (eorsKeyword.trim() !== '') {
        const ek = eorsKeyword.toLowerCase();
        if (
          !r.eorsTransporta.toLowerCase().includes(ek) &&
          !r.eorsDisposicionFinal.toLowerCase().includes(ek)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [allRecords, queryMonth, queryCategory, residueKeyword, eorsKeyword]);

  const totalProjectWeightKg = allRecords.reduce((s, r) => s + r.pesoKg, 0);
  const resultWeightKg = matchingRecords.reduce((s, r) => s + r.pesoKg, 0);
  const resultTons = resultWeightKg / 1000;
  const resultVolumeM3 = matchingRecords.reduce((s, r) => s + r.volumenM3, 0);
  const shareOfProjectPct =
    totalProjectWeightKg > 0 ? (resultWeightKg / totalProjectWeightKg) * 100 : 0;

  const valorizedResultKg = matchingRecords
    .filter((r) => r.tipoResiduo.includes('Aprovechable'))
    .reduce((s, r) => s + r.pesoKg, 0);
  const valorizedResultPct =
    resultWeightKg > 0 ? (valorizedResultKg / resultWeightKg) * 100 : 0;

  const certifiedCount = matchingRecords.filter((r) => r.certificadoDisposicion).length;

  return (
    <div className="space-y-6">
      {/* Main Black & Emerald Visual Query Console */}
      <div className="rounded-2xl border border-emerald-900/80 bg-[#09100C] text-white p-6 lg:p-8 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-emerald-950 pb-5">
          <div>
            <div className="text-xs font-semibold text-emerald-400">
              Motor Interactivo de Consultas sobre la Data
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white mt-0.5">
              Consultor Instantáneo de Generación y Manejo de Residuos
            </h2>
            <p className="text-xs text-neutral-400 mt-1">
              Pregunte en lenguaje natural o combine filtros rápidos por mes, tipo de residuo o EO-RS para obtener el cálculo inmediato.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setQueryMonth('ALL');
              setQueryCategory('ALL');
              setResidueKeyword('');
              setEorsKeyword('');
              setNaturalTextQuery('');
              setActivePresetId('');
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-800/80 bg-emerald-950/40 px-3.5 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-900/50 self-start lg:self-auto whitespace-nowrap shrink-0"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Limpiar Consulta
          </button>
        </div>

        {/* Natural Language Search Bar */}
        <div className="mt-5">
          <label className="block text-xs font-semibold text-emerald-400 mb-2">
            1. Escriba su consulta rápida (ej. «¿Cuántos residuos generé en octubre?», «peligrosos en septiembre», «concreto»):
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-emerald-400" />
            <input
              type="text"
              value={naturalTextQuery}
              onChange={(e) => handleNaturalLanguageSearch(e.target.value)}
              placeholder="Ej: ¿Cuántos residuos generé en el mes de octubre 2026?"
              className="w-full rounded-xl border border-emerald-700/70 bg-[#0F1B14] pl-12 pr-4 py-3.5 text-sm text-white placeholder-neutral-500 focus:border-emerald-400 focus:outline-hidden"
            />
          </div>

          {/* 1-Click Preset Question Buttons */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs text-neutral-400 mr-1">Consultas en 1 clic:</span>
            {PRESET_QUESTIONS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  activePresetId === preset.id
                    ? 'bg-emerald-500 text-black font-bold'
                    : 'border border-emerald-900/80 bg-[#0F1914] text-neutral-300 hover:border-emerald-500 hover:text-white'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Structured Parameter Filter Controls */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 border-t border-emerald-950 pt-5">
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5">
              Mes / Periodo Consultado
            </label>
            <select
              value={queryMonth}
              onChange={(e) => {
                setQueryMonth(e.target.value);
                setActivePresetId('');
              }}
              className="w-full rounded-lg border border-emerald-800/80 bg-[#0F1B14] px-3 py-2.5 text-xs font-semibold text-white focus:border-emerald-400 focus:outline-hidden"
            >
              <option value="ALL">Todos los Meses (Acumulado Anual)</option>
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {formatMonthLabel(m)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5">
              Clasificación Normativa del Residuo
            </label>
            <select
              value={queryCategory}
              onChange={(e) => {
                setQueryCategory(e.target.value);
                setActivePresetId('');
              }}
              className="w-full rounded-lg border border-emerald-800/80 bg-[#0F1B14] px-3 py-2.5 text-xs font-semibold text-white focus:border-emerald-400 focus:outline-hidden"
            >
              <option value="ALL">Todas las Clasificaciones</option>
              <option value="APROVECHABLES_ALL">Todos los Aprovechables / Valorizables</option>
              <option value="PELIGROSOS_ALL">Todos los Residuos Peligrosos</option>
              <option value="No Peligroso - Aprovechable">No Peligroso - Aprovechable</option>
              <option value="No Peligroso - No Aprovechable">No Peligroso - No Aprovechable</option>
              <option value="Peligroso - No Aprovechable">Peligroso - No Aprovechable</option>
              <option value="Peligroso - Aprovechable">Peligroso - Aprovechable</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5">
              Material / Frente Específico
            </label>
            <input
              type="text"
              value={residueKeyword}
              onChange={(e) => {
                setResidueKeyword(e.target.value);
                setActivePresetId('');
              }}
              placeholder="Ej. concreto, excavación, acero..."
              className="w-full rounded-lg border border-emerald-800/80 bg-[#0F1B14] px-3 py-2.5 text-xs text-white placeholder-neutral-500 focus:border-emerald-400 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5">
              Filtrar por Operador EO-RS
            </label>
            <input
              type="text"
              value={eorsKeyword}
              onChange={(e) => {
                setEorsKeyword(e.target.value);
                setActivePresetId('');
              }}
              placeholder="Ej. EcoTrans, Séché, Innova..."
              className="w-full rounded-lg border border-emerald-800/80 bg-[#0F1B14] px-3 py-2.5 text-xs text-white placeholder-neutral-500 focus:border-emerald-400 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Immediate Answer Banner */}
        <div className="mt-6 rounded-xl border border-emerald-500/50 bg-gradient-to-r from-emerald-950/90 via-[#0E2218] to-[#0A140F] p-5">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                <span>RESPUESTA INMEDIATA DEL SISTEMA</span>
              </div>
              <p className="text-sm sm:text-base text-neutral-200 leading-relaxed">
                En el periodo <strong className="text-white font-bold">{formatMonthLabel(queryMonth)}</strong>
                {queryCategory !== 'ALL' ? (
                  <>
                    {' '}para la categoría <strong className="text-emerald-400">{queryCategory}</strong>
                  </>
                ) : null}
                {residueKeyword ? (
                  <>
                    {' '}con filtro <strong className="text-emerald-400">«{residueKeyword}»</strong>
                  </>
                ) : null}
                , se generaron un total de{' '}
                <strong className="font-mono text-lg text-emerald-400 font-bold">
                  {resultTons.toFixed(2)} toneladas
                </strong>{' '}
                (<span className="font-mono">{resultWeightKg.toLocaleString('es-PE')} kg</span>) equivalentes a{' '}
                <strong className="font-mono text-lg text-white font-bold">
                  {resultVolumeM3.toFixed(2)} m³
                </strong>{' '}
                en <strong className="font-mono text-white">{matchingRecords.length} partida(s)</strong> registradas.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => onExportQueryPdf(matchingRecords, queryMonth)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-2 text-xs font-bold text-black hover:bg-neutral-200 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <FileDown className="h-3.5 w-3.5" />
                Descargar PDF de esta Consulta
              </button>
              <button
                type="button"
                onClick={() => onExportQueryExcel(matchingRecords, queryMonth)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3.5 py-2 text-xs font-bold text-black hover:bg-emerald-400 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                Exportar Consulta a Excel
              </button>
            </div>
          </div>

          {/* 4 Instant Metric Boxes */}
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 border-t border-emerald-800/60 pt-4">
            <div className="rounded-lg bg-black/40 p-3 border border-emerald-900/50">
              <div className="text-[11px] text-neutral-400">Peso Total Consultado</div>
              <div className="font-mono text-xl font-bold tabular-nums text-emerald-400 mt-0.5">
                {resultTons.toFixed(2)} t
              </div>
              <div className="font-mono text-[11px] text-neutral-400">
                {resultWeightKg.toLocaleString('es-PE')} kg ({shareOfProjectPct.toFixed(1)}% del proyecto)
              </div>
            </div>

            <div className="rounded-lg bg-black/40 p-3 border border-emerald-900/50">
              <div className="text-[11px] text-neutral-400">Volumen Total Consultado</div>
              <div className="font-mono text-xl font-bold tabular-nums text-white mt-0.5">
                {resultVolumeM3.toFixed(2)} m³
              </div>
              <div className="font-mono text-[11px] text-neutral-400">
                {matchingRecords.length} registros encontrados
              </div>
            </div>

            <div className="rounded-lg bg-black/40 p-3 border border-emerald-900/50">
              <div className="text-[11px] text-neutral-400">Fracción Valorizada en Consulta</div>
              <div className="font-mono text-xl font-bold tabular-nums text-emerald-400 mt-0.5">
                {valorizedResultPct.toFixed(1)}%
              </div>
              <div className="font-mono text-[11px] text-neutral-400">
                {(valorizedResultKg / 1000).toFixed(2)} t reaprovechadas
              </div>
            </div>

            <div className="rounded-lg bg-black/40 p-3 border border-emerald-900/50">
              <div className="text-[11px] text-neutral-400">Certificados EO-RS Acreditados</div>
              <div className="font-mono text-xl font-bold tabular-nums text-white mt-0.5">
                {certifiedCount} / {matchingRecords.length}
              </div>
              <div className="text-[11px] text-emerald-400">
                Partidas con constancia de evacuación
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Matching Records Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-6 py-4 bg-slate-50">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Detalle de Partidas que Coinciden con tu Consulta ({matchingRecords.length})
            </h3>
            <p className="text-xs text-slate-500">
              Resultados filtrados inmediatamente desde la base de datos del Registro Interno
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              onApplyToGlobalFilter(
                queryMonth,
                queryCategory.includes('_ALL') ? 'ALL' : queryCategory
              )
            }
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800 whitespace-nowrap shrink-0"
          >
            <span>Abrir estos resultados en el Registro Diario</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-950 text-white">
                <th className="px-4 py-3 font-semibold text-center w-12">Ítem</th>
                <th className="px-4 py-3 font-semibold w-28">Fecha</th>
                <th className="px-4 py-3 font-semibold">Nombre de Residuo</th>
                <th className="px-4 py-3 font-semibold">Tipo de Residuo</th>
                <th className="px-4 py-3 font-semibold text-right">Volumen</th>
                <th className="px-4 py-3 font-semibold text-right">Peso</th>
                <th className="px-4 py-3 font-semibold">EO-RS Transporta</th>
                <th className="px-4 py-3 font-semibold">EO-RS Disposición Final / Valorización</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {matchingRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-slate-500">
                    No existen registros que coincidan con los criterios de esta consulta. Pruebe seleccionar «Todos los Meses» o limpiar el filtro de texto.
                  </td>
                </tr>
              ) : (
                matchingRecords.map((rec, idx) => (
                  <tr key={rec.id} className="hover:bg-emerald-50/40 transition-colors">
                    <td className="px-4 py-3 text-center font-mono tabular-nums text-slate-500">
                      {String(idx + 1).padStart(2, '0')}
                    </td>
                    <td className="px-4 py-3 font-mono tabular-nums font-medium text-slate-900 whitespace-nowrap">
                      {rec.fecha}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {rec.nombreResiduo}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          rec.tipoResiduo.startsWith('Peligroso')
                            ? 'font-semibold text-red-700'
                            : rec.tipoResiduo.includes('Aprovechable')
                            ? 'font-semibold text-emerald-800'
                            : 'text-slate-700'
                        }
                      >
                        {rec.tipoResiduo}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-900 whitespace-nowrap">
                      {rec.volumenM3.toFixed(2)} m³
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums font-bold text-slate-950 whitespace-nowrap">
                      {rec.pesoKg.toLocaleString('es-PE')} kg ({(rec.pesoKg / 1000).toFixed(2)} t)
                    </td>
                    <td className="px-4 py-3 text-slate-700">{rec.eorsTransporta}</td>
                    <td className="px-4 py-3 text-slate-700">{rec.eorsDisposicionFinal}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
