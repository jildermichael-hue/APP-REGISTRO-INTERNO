import React, { useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  FileCheck2,
  Layers,
  PenTool,
  Plus,
  Recycle,
  Scale,
  Search,
  ShieldAlert,
  Truck,
} from 'lucide-react';
import {
  MonthlySignature,
  ProjectMetadata,
  WasteRecord,
} from '../types/waste';
import { formatMonthLabel } from '../utils/complianceEngine';

interface AnalyticsDashboardProps {
  allRecords: WasteRecord[];
  filteredRecords: WasteRecord[];
  selectedMonth: string;
  project: ProjectMetadata;
  signatures?: Record<string, MonthlySignature>;
  onSelectMonth: (month: string) => void;
  onOpenQuickQuery?: () => void;
  onOpenNewRecordForDate?: (dateStr: string) => void;
  onOpenSignatureModal?: () => void;
}

const ORDERED_MONTHS = ['2026-08', '2026-09', '2026-10', 'ALL'];

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  allRecords,
  filteredRecords,
  selectedMonth,
  project,
  signatures = {},
  onSelectMonth,
  onOpenQuickQuery,
  onOpenNewRecordForDate,
  onOpenSignatureModal,
}) => {
  const [selectedDayFilter, setSelectedDayFilter] = useState<string | null>(null);
  const [chartViewMode, setChartViewMode] = useState<'mensual' | 'partidas'>('partidas');

  // Cycle through months using the < and > arrows in the left featured card
  const handleCycleMonth = (dir: -1 | 1) => {
    const idx = ORDERED_MONTHS.indexOf(selectedMonth);
    const nextIdx =
      (idx + dir + ORDERED_MONTHS.length) % ORDERED_MONTHS.length;
    setSelectedDayFilter(null);
    onSelectMonth(ORDERED_MONTHS[nextIdx]);
  };

  // KPI Calculations for filtered view
  const activeRecords = useMemo(() => {
    if (!selectedDayFilter) return filteredRecords;
    return filteredRecords.filter((r) => r.fecha === selectedDayFilter);
  }, [filteredRecords, selectedDayFilter]);

  const totalWeightKg = activeRecords.reduce((s, r) => s + r.pesoKg, 0);
  const totalTons = totalWeightKg / 1000;
  const totalVolumeM3 = activeRecords.reduce((s, r) => s + r.volumenM3, 0);

  const valorizableKg = activeRecords
    .filter((r) => r.tipoResiduo.includes('Aprovechable'))
    .reduce((s, r) => s + r.pesoKg, 0);
  const peligrosoKg = activeRecords
    .filter((r) => r.tipoResiduo.startsWith('Peligroso'))
    .reduce((s, r) => s + r.pesoKg, 0);

  const valorizationPct =
    totalWeightKg > 0 ? (valorizableKg / totalWeightKg) * 100 : 0;
  const certifiedCount = activeRecords.filter(
    (r) => r.certificadoDisposicion
  ).length;

  const annualTons = allRecords.reduce((s, r) => s + r.pesoKg, 0) / 1000;

  // Build data points for the Minimalist Dual Vertical Bar Chart (like "Hospital Survey" in reference)
  const chartPoints = useMemo(() => {
    if (chartViewMode === 'mensual') {
      const months = ['2026-08', '2026-09', '2026-10'];
      return months.map((m) => {
        const recs = allRecords.filter((r) => r.fecha.startsWith(m));
        const valT =
          recs
            .filter((r) => r.tipoResiduo.includes('Aprovechable'))
            .reduce((s, r) => s + r.pesoKg, 0) / 1000;
        const nonValT =
          recs
            .filter((r) => !r.tipoResiduo.includes('Aprovechable'))
            .reduce((s, r) => s + r.pesoKg, 0) / 1000;
        const label =
          m === '2026-08' ? 'Ago' : m === '2026-09' ? 'Sep' : 'Oct';
        return {
          key: m,
          label,
          fullTitle: formatMonthLabel(m),
          greenVal: valT,
          yellowVal: nonValT,
          unit: 't',
        };
      });
    }

    // By daily entries / dates within the filtered view
    return filteredRecords.slice(0, 10).map((r, idx) => {
      const isVal = r.tipoResiduo.includes('Aprovechable');
      const tons = r.pesoKg / 1000;
      return {
        key: r.id,
        label: r.fecha.slice(5), // MM-DD
        fullTitle: `${r.fecha}: ${r.nombreResiduo}`,
        greenVal: isVal ? tons : 0,
        yellowVal: !isVal ? tons : r.volumenM3 / 2,
        unit: 't',
      };
    });
  }, [allRecords, filteredRecords, chartViewMode]);

  const maxChartVal = Math.max(
    ...chartPoints.map((p) => Math.max(p.greenVal, p.yellowVal)),
    10
  );

  // Calendar generation for active month (defaults to 2026-10 if 'ALL')
  const calendarMonthStr = selectedMonth === 'ALL' ? '2026-10' : selectedMonth;
  const [calYear, calMonth] = calendarMonthStr.split('-').map(Number);

  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(calYear, calMonth - 1, 1).getDay(); // 0 = Sun
    const daysInMonth = new Date(calYear, calMonth, 0).getDate();
    const prevMonthDays = new Date(calYear, calMonth - 1, 0).getDate();

    const cells: {
      day: number;
      currentMonth: boolean;
      dateStr: string;
      hasRecords: boolean;
      recordTons: number;
    }[] = [];

    // Previous month trailing days
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      cells.push({
        day: d,
        currentMonth: false,
        dateStr: '',
        hasRecords: false,
        recordTons: 0,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${calYear}-${String(calMonth).padStart(2, '0')}-${String(
        d
      ).padStart(2, '0')}`;
      const dayRecs = allRecords.filter((r) => r.fecha === dateStr);
      const dayTons = dayRecs.reduce((s, r) => s + r.pesoKg, 0) / 1000;
      cells.push({
        day: d,
        currentMonth: true,
        dateStr,
        hasRecords: dayRecs.length > 0,
        recordTons: dayTons,
      });
    }

    // Next month leading days to complete 35 or 42 cells
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      cells.push({
        day: d,
        currentMonth: false,
        dateStr: '',
        hasRecords: false,
        recordTons: 0,
      });
    }

    return cells;
  }, [calYear, calMonth, allRecords]);

  const activeSig =
    selectedMonth !== 'ALL' ? signatures[selectedMonth] : signatures['2026-10'];

  return (
    <div className="space-y-6">
      {/* TOP SECTION: Left Featured Responsible Card + Right 2x3 Minimalist KPI Grid */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12 items-stretch">
        {/* Left Featured Card (Adapted from "Today Available / Doctor Card" in reference) */}
        <div className="xl:col-span-4 rounded-2xl bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col justify-between items-center text-center">
          <div className="space-y-1">
            <div className="text-base font-bold text-[#00A859]">
              {selectedDayFilter
                ? `Filtro Día: ${selectedDayFilter}`
                : formatMonthLabel(selectedMonth)}
            </div>
            <div className="text-xs font-bold text-slate-900 line-clamp-1">
              {project.empresaQueRegistra}
            </div>
          </div>

          {/* Center Emblem / Responsible Avatar with < and > Month Switchers */}
          <div className="my-5 flex items-center justify-center gap-6 w-full">
            <button
              type="button"
              onClick={() => handleCycleMonth(-1)}
              title="Periodo anterior"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-[#00A859] hover:text-white transition-colors cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="relative h-28 w-28 rounded-full bg-gradient-to-b from-[#E6F7EE] to-[#D1F0E0] border-4 border-white shadow-md flex flex-col items-center justify-center">
              <Recycle className="h-10 w-10 text-[#00A859]" />
              <span className="mt-1 font-mono text-xs font-extrabold text-slate-900">
                {totalTons.toFixed(1)} t
              </span>
            </div>

            <button
              type="button"
              onClick={() => handleCycleMonth(1)}
              title="Periodo siguiente"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-[#00A859] hover:text-white transition-colors cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-1">
            <div className="text-sm font-bold text-[#00A859]">
              {project.responsableRegistro}
            </div>
            <div className="text-xs text-slate-500">
              {project.cargoResponsable} ·{' '}
              <span className="font-mono font-semibold text-slate-700">
                {project.cipDni}
              </span>
            </div>
            <div className="pt-2 flex items-center justify-center gap-2">
              {selectedDayFilter ? (
                <button
                  type="button"
                  onClick={() => setSelectedDayFilter(null)}
                  className="text-xs font-semibold text-[#00A859] hover:underline cursor-pointer"
                >
                  Ver todo el mes ({formatMonthLabel(selectedMonth)})
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onOpenSignatureModal}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#E8F8F0] px-3.5 py-1 text-[11px] font-bold text-[#00A859] hover:bg-[#D1F0E0] transition-colors cursor-pointer"
                >
                  <PenTool className="h-3 w-3" />
                  {activeSig ? 'Registro Mensual Firmado CIP' : 'Firmar Registro del Mes'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right 2x3 Grid of 6 Minimalist KPI Cards */}
        <div className="xl:col-span-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {/* Card 1: Masa Generada */}
          <div className="rounded-2xl bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col justify-between">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-2xl font-bold font-mono tabular-nums text-[#00A859]">
                  {totalTons.toFixed(1)} t
                </div>
                <div className="mt-0.5 text-xs font-bold text-slate-900">
                  Masa Generada
                </div>
              </div>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#00A859] text-white shadow-sm">
                <Scale className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 text-[11px] text-slate-400 font-mono">
              {totalWeightKg.toLocaleString('es-PE')} kg · Anual: {annualTons.toFixed(1)} t
            </div>
          </div>

          {/* Card 2: Volumen Evacuado */}
          <div className="rounded-2xl bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col justify-between">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-2xl font-bold font-mono tabular-nums text-[#00A859]">
                  {totalVolumeM3.toFixed(1)} m³
                </div>
                <div className="mt-0.5 text-xs font-bold text-slate-900">
                  Volumen Total
                </div>
              </div>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#00A859] text-white shadow-sm">
                <Layers className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 text-[11px] text-slate-400 font-mono">
              Densidad prom: {totalVolumeM3 > 0 ? Math.round(totalWeightKg / totalVolumeM3) : 0} kg/m³
            </div>
          </div>

          {/* Card 3: Valorización RCD */}
          <div className="rounded-2xl bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col justify-between">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-2xl font-bold font-mono tabular-nums text-[#00A859]">
                  {valorizationPct.toFixed(1)}%
                </div>
                <div className="mt-0.5 text-xs font-bold text-slate-900">
                  Valorización RCD
                </div>
              </div>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#00A859] text-white shadow-sm">
                <Recycle className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 text-[11px] text-slate-400 font-mono">
              {(valorizableKg / 1000).toFixed(1)} t reaprovechadas (Meta {project.metaValorizacionPct}%)
            </div>
          </div>

          {/* Card 4: Partidas Registradas */}
          <div className="rounded-2xl bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col justify-between">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-2xl font-bold font-mono tabular-nums text-[#00A859]">
                  {activeRecords.length}
                </div>
                <div className="mt-0.5 text-xs font-bold text-slate-900">
                  Partidas del Periodo
                </div>
              </div>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#00A859] text-white shadow-sm">
                <ClipboardCheck className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 text-[11px] text-slate-400">
              Total acumulado en sistema: {allRecords.length} partidas
            </div>
          </div>

          {/* Card 5: Residuos Peligrosos */}
          <div className="rounded-2xl bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col justify-between">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-2xl font-bold font-mono tabular-nums text-[#00A859]">
                  {peligrosoKg.toLocaleString('es-PE')} kg
                </div>
                <div className="mt-0.5 text-xs font-bold text-slate-900">
                  Residuos Peligrosos
                </div>
              </div>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#00A859] text-white shadow-sm">
                <ShieldAlert className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 text-[11px] text-slate-400">
              Control de Manifiestos SIGERSOL
            </div>
          </div>

          {/* Card 6: Certificados EO-RS */}
          <div className="rounded-2xl bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col justify-between">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-2xl font-bold font-mono tabular-nums text-[#00A859]">
                  {certifiedCount}/{activeRecords.length}
                </div>
                <div className="mt-0.5 text-xs font-bold text-slate-900">
                  Certificados EO-RS
                </div>
              </div>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#00A859] text-white shadow-sm">
                <Truck className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 text-[11px] text-slate-400">
              Evacuación acreditada ante OEFA
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION: Left Minimalist Vertical Bar Chart + Right Interactive Calendar */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12 items-stretch">
        {/* Left Card: Minimalist Vertical Bar Chart (Adapted from "Hospital Survey" in reference) */}
        <div className="xl:col-span-8 rounded-2xl bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col justify-between">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Monitoreo de Generación de Residuos Sólidos (Toneladas)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Comparativa entre residuos valorizables y residuos de disposición final
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-5">
              {/* Clean Legend matching reference */}
              <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#00A859]" />
                  <span>Valorizable (t)</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#F59E0B]" />
                  <span>No Aprovechable / Otros</span>
                </span>
              </div>

              {/* View Mode Switcher */}
              <div className="flex items-center rounded-lg bg-slate-100 p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setChartViewMode('partidas')}
                  className={`rounded-md px-2.5 py-1 font-semibold transition-colors cursor-pointer ${
                    chartViewMode === 'partidas'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Por Fecha
                </button>
                <button
                  type="button"
                  onClick={() => setChartViewMode('mensual')}
                  className={`rounded-md px-2.5 py-1 font-semibold transition-colors cursor-pointer ${
                    chartViewMode === 'mensual'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Por Mes
                </button>
              </div>
            </div>
          </div>

          {/* Vertical Bar Chart Canvas */}
          <div className="relative h-64 w-full pt-4 pb-6 flex">
            {/* Y-Axis Labels */}
            <div className="flex flex-col justify-between pr-4 text-[11px] font-mono tabular-nums text-slate-400 select-none">
              <span>{Math.round(maxChartVal)}</span>
              <span>{Math.round(maxChartVal * 0.75)}</span>
              <span>{Math.round(maxChartVal * 0.5)}</span>
              <span>{Math.round(maxChartVal * 0.25)}</span>
              <span>0</span>
            </div>

            {/* Horizontal Grid Lines + Vertical Dual Bars */}
            <div className="relative flex-1 flex flex-col justify-between border-b border-slate-100">
              <div className="border-t border-slate-100 w-full h-0" />
              <div className="border-t border-slate-100 w-full h-0" />
              <div className="border-t border-slate-100 w-full h-0" />
              <div className="border-t border-slate-100 w-full h-0" />
              <div className="w-full h-0" />

              {/* Bars Overlay */}
              <div className="absolute inset-0 flex items-end justify-around px-2 sm:px-6">
                {chartPoints.map((pt) => {
                  const greenH = Math.min(
                    100,
                    Math.max(pt.greenVal > 0 ? 8 : 2, (pt.greenVal / maxChartVal) * 100)
                  );
                  const yellowH = Math.min(
                    100,
                    Math.max(pt.yellowVal > 0 ? 8 : 2, (pt.yellowVal / maxChartVal) * 100)
                  );

                  return (
                    <div
                      key={pt.key}
                      onClick={() => {
                        if (chartViewMode === 'mensual') {
                          onSelectMonth(pt.key);
                        }
                      }}
                      title={`${pt.fullTitle} — Valorizable: ${pt.greenVal.toFixed(1)} t | Otros: ${pt.yellowVal.toFixed(1)} t`}
                      className="group relative flex flex-col items-center h-full justify-end cursor-pointer"
                    >
                      {/* Hover Tooltip */}
                      <div className="pointer-events-none absolute -top-8 hidden group-hover:flex rounded-md bg-slate-900 px-2 py-1 text-[10px] font-mono text-white whitespace-nowrap z-10 shadow-md">
                        {pt.greenVal.toFixed(1)}t / {pt.yellowVal.toFixed(1)}t
                      </div>

                      <div className="flex items-end gap-1.5 h-full">
                        <div
                          style={{ height: `${greenH}%` }}
                          className="w-2.5 sm:w-3 rounded-t-full bg-[#00A859] transition-all group-hover:opacity-85"
                        />
                        <div
                          style={{ height: `${yellowH}%` }}
                          className="w-2.5 sm:w-3 rounded-t-full bg-[#FACC15] transition-all group-hover:opacity-85"
                        />
                      </div>

                      <span className="absolute -bottom-6 text-[11px] font-mono text-slate-400">
                        {pt.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Quick Bottom Action Strip inside Chart Card */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
            <span>
              ¿Deseas hacer una consulta específica por tipo de residuo o mes?
            </span>
            {onOpenQuickQuery && (
              <button
                type="button"
                onClick={onOpenQuickQuery}
                className="inline-flex items-center gap-1.5 font-bold text-[#00A859] hover:underline cursor-pointer"
              >
                <Search className="h-3.5 w-3.5" />
                Abrir Consultor Rápido de Datos
              </button>
            )}
          </div>
        </div>

        {/* Right Card: Minimalist Interactive Calendar (Adapted from "Calendar" in reference) */}
        <div className="xl:col-span-4 rounded-2xl bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Calendario de Registro
            </h3>

            {/* Month Navigator */}
            <div className="mt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleCycleMonth(-1)}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-[#00A859] hover:text-white transition-colors cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs font-bold text-[#00A859]">
                {formatMonthLabel(calendarMonthStr)}
              </span>
              <button
                type="button"
                onClick={() => handleCycleMonth(1)}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-[#00A859] hover:text-white transition-colors cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Days of Week Header */}
            <div className="mt-5 grid grid-cols-7 text-center text-[11px] font-bold text-slate-700">
              <span>Do</span>
              <span>Lu</span>
              <span>Ma</span>
              <span>Mi</span>
              <span>Ju</span>
              <span>Vi</span>
              <span>Sa</span>
            </div>

            {/* Days Grid */}
            <div className="mt-3 grid grid-cols-7 gap-y-2 text-center text-xs font-mono tabular-nums">
              {calendarDays.map((cell, idx) => {
                if (!cell.currentMonth) {
                  return (
                    <div
                      key={`empty-${idx}`}
                      className="flex h-8 w-8 mx-auto items-center justify-center text-slate-300 select-none"
                    >
                      {cell.day}
                    </div>
                  );
                }

                const isSelected = selectedDayFilter === cell.dateStr;

                return (
                  <button
                    key={cell.dateStr}
                    type="button"
                    onClick={() => {
                      if (cell.hasRecords) {
                        setSelectedDayFilter(
                          isSelected ? null : cell.dateStr
                        );
                      } else if (onOpenNewRecordForDate) {
                        onOpenNewRecordForDate(cell.dateStr);
                      }
                    }}
                    title={
                      cell.hasRecords
                        ? `${cell.dateStr}: ${cell.recordTons.toFixed(1)} t registradas (Clic para filtrar)`
                        : `Clic para registrar residuo el ${cell.dateStr}`
                    }
                    className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 text-white font-bold ring-2 ring-[#00A859]'
                        : cell.hasRecords
                        ? 'bg-[#00A859] text-white font-bold shadow-xs hover:bg-[#059669]'
                        : 'text-slate-700 hover:bg-emerald-50 hover:text-[#00A859]'
                    }`}
                  >
                    {cell.day}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#00A859]" />
              <span>Día con registro de residuos</span>
            </span>
            {onOpenNewRecordForDate && (
              <button
                type="button"
                onClick={() => onOpenNewRecordForDate(`${calendarMonthStr}-16`)}
                className="inline-flex items-center gap-1 font-bold text-[#00A859] hover:underline cursor-pointer"
              >
                <Plus className="h-3 w-3" />
                Registrar día
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
