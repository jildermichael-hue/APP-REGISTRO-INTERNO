import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  Bell,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Edit2,
  FileCheck2,
  FileDown,
  FileSpreadsheet,
  Home,
  PenTool,
  Plus,
  Recycle,
  RotateCcw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { OfficialRegistryFormatView } from './components/OfficialRegistryFormatView';
import { QuickQueryEngine } from './components/QuickQueryEngine';
import { SignatureModal } from './components/SignatureModal';
import { WasteFormModal } from './components/WasteFormModal';
import { WelcomeScreen } from './components/WelcomeScreen';
import {
  INITIAL_EORS_PROVIDERS,
  INITIAL_PROJECT_METADATA,
  INITIAL_SIGNATURES,
  INITIAL_WASTE_RECORDS,
} from './data/initialData';
import {
  ComplianceAlert,
  EorsProvider,
  MonthlySignature,
  ProjectMetadata,
  WasteRecord,
} from './types/waste';
import {
  evaluateComplianceAlerts,
  formatMonthLabel,
} from './utils/complianceEngine';
import { exportOfficialExcel, exportOfficialPdf } from './utils/exportReport';

type ActiveTab =
  | 'dashboard'
  | 'consultas'
  | 'registro'
  | 'formato_oficial'
  | 'alertas'
  | 'directorio_eors';

const STORAGE_KEYS = {
  RECORDS: 'ecoreg_cd_records_v1',
  PROJECT: 'ecoreg_cd_project_v1',
  SIGNATURES: 'ecoreg_cd_signatures_v1',
  EORS: 'ecoreg_cd_eors_v1',
};

const SIDEBAR_ITEMS: {
  id: ActiveTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'consultas', label: 'Consultas Rápidas', icon: Search },
  { id: 'registro', label: 'Registro Diario', icon: ClipboardList },
  { id: 'formato_oficial', label: 'Formato Oficial', icon: FileCheck2 },
  { id: 'alertas', label: 'Alertas Legales', icon: ShieldAlert },
  { id: 'directorio_eors', label: 'Operadores EO-RS', icon: Building2 },
];

export default function App() {
  const [showWelcome, setShowWelcome] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Persistent State
  const [records, setRecords] = useState<WasteRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.RECORDS);
      return saved ? JSON.parse(saved) : INITIAL_WASTE_RECORDS;
    } catch {
      return INITIAL_WASTE_RECORDS;
    }
  });

  const [project, setProject] = useState<ProjectMetadata>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PROJECT);
      return saved ? JSON.parse(saved) : INITIAL_PROJECT_METADATA;
    } catch {
      return INITIAL_PROJECT_METADATA;
    }
  });

  const [signatures, setSignatures] = useState<Record<string, MonthlySignature>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SIGNATURES);
      return saved ? JSON.parse(saved) : INITIAL_SIGNATURES;
    } catch {
      return INITIAL_SIGNATURES;
    }
  });

  const [eorsProviders, setEorsProviders] = useState<EorsProvider[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.EORS);
      return saved ? JSON.parse(saved) : INITIAL_EORS_PROVIDERS;
    } catch {
      return INITIAL_EORS_PROVIDERS;
    }
  });

  // Filters & Modals
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-10');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isWasteModalOpen, setIsWasteModalOpen] = useState<boolean>(false);
  const [defaultModalDate, setDefaultModalDate] = useState<string>('2026-10-16');
  const [editingRecord, setEditingRecord] = useState<WasteRecord | null>(null);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New EO-RS Form state
  const [newEorsName, setNewEorsName] = useState('');
  const [newEorsRuc, setNewEorsRuc] = useState('');
  const [newEorsReg, setNewEorsReg] = useState('');
  const [newEorsService, setNewEorsService] = useState<EorsProvider['tipoServicio']>('Transporte');
  const [newEorsHazardous, setNewEorsHazardous] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));
    } catch {
      // ignore
    }
  }, [records]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PROJECT, JSON.stringify(project));
    } catch {
      // ignore
    }
  }, [project]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SIGNATURES, JSON.stringify(signatures));
    } catch {
      // ignore
    }
  }, [signatures]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.EORS, JSON.stringify(eorsProviders));
    } catch {
      // ignore
    }
  }, [eorsProviders]);

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  const availableMonths = useMemo(() => {
    const set = new Set<string>(['2026-10', '2026-09', '2026-08']);
    records.forEach((r) => {
      if (r.fecha && r.fecha.length >= 7) {
        set.add(r.fecha.slice(0, 7));
      }
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [records]);

  const monthRecords = useMemo(() => {
    const list =
      selectedMonth === 'ALL'
        ? records
        : records.filter((r) => r.fecha.startsWith(selectedMonth));
    return [...list].sort((a, b) => a.fecha.localeCompare(b.fecha));
  }, [records, selectedMonth]);

  const filteredRecords = useMemo(() => {
    return monthRecords.filter((r) => {
      if (categoryFilter !== 'ALL' && r.tipoResiduo !== categoryFilter) {
        return false;
      }
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const match =
          r.nombreResiduo.toLowerCase().includes(q) ||
          r.eorsTransporta.toLowerCase().includes(q) ||
          r.eorsDisposicionFinal.toLowerCase().includes(q) ||
          r.nroManifiestoGuia.toLowerCase().includes(q) ||
          (r.frenteTrabajo && r.frenteTrabajo.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [monthRecords, categoryFilter, searchQuery]);

  const complianceAlerts = useMemo(() => {
    return evaluateComplianceAlerts(
      monthRecords,
      selectedMonth,
      signatures,
      project
    );
  }, [monthRecords, selectedMonth, signatures, project]);

  const activeSignature =
    selectedMonth !== 'ALL' ? signatures[selectedMonth] : signatures['2026-10'];

  const totalVolume = filteredRecords.reduce((s, r) => s + r.volumenM3, 0);
  const totalWeightKg = filteredRecords.reduce((s, r) => s + r.pesoKg, 0);

  const handleSaveWasteRecord = (
    recordData: Omit<WasteRecord, 'id'>,
    existingId?: string
  ) => {
    if (existingId) {
      setRecords((prev) =>
        prev.map((r) => (r.id === existingId ? { ...recordData, id: existingId } : r))
      );
      showNotification('Partida actualizada correctamente en el Registro Interno.');
    } else {
      const newRecord: WasteRecord = {
        ...recordData,
        id: `rec-${Date.now()}`,
      };
      setRecords((prev) => [...prev, newRecord]);
      const recMonth = recordData.fecha.slice(0, 7);
      if (selectedMonth !== 'ALL' && selectedMonth !== recMonth) {
        setSelectedMonth(recMonth);
      }
      showNotification('Nuevo registro diario de residuo incorporado al expediente.');
    }
    setEditingRecord(null);
  };

  const handleDeleteRecord = (id: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
    showNotification('Partida eliminada del registro.');
  };

  const handleSaveSignature = (sig: MonthlySignature) => {
    setSignatures((prev) => ({
      ...prev,
      [sig.month]: sig,
    }));
    showNotification(
      `Firma digital estampada con éxito para ${formatMonthLabel(sig.month)} (${sig.verificationHash}).`
    );
  };

  const handleResolveAlertAction = (alert: ComplianceAlert) => {
    if (alert.actionType === 'sign_month') {
      if (selectedMonth === 'ALL') {
        setSelectedMonth('2026-10');
      }
      setIsSignatureModalOpen(true);
      return;
    }

    if (alert.actionType === 'edit_record' && alert.affectedRecordIds.length > 0) {
      const targetRec = records.find((r) => r.id === alert.affectedRecordIds[0]);
      if (targetRec) {
        setEditingRecord(targetRec);
        setIsWasteModalOpen(true);
      }
      return;
    }

    if (alert.actionType === 'evacuate_records' && alert.affectedRecordIds.length > 0) {
      setRecords((prev) =>
        prev.map((r) =>
          alert.affectedRecordIds.includes(r.id)
            ? {
                ...r,
                estadoEvacuacion: 'Evacuado con Certificado',
                certificadoDisposicion: true,
                nroManifiestoGuia:
                  r.nroManifiestoGuia ||
                  (r.tipoResiduo.startsWith('Peligroso')
                    ? 'MAN-PEL-2026-00948'
                    : 'GR-004-001925'),
              }
            : r
        )
      );
      showNotification(
        'Certificados de disposición final y guías actualizados para las partidas pendientes.'
      );
      return;
    }

    setActiveTab('registro');
  };

  const handleExportPdf = async () => {
    await exportOfficialPdf(
      filteredRecords,
      project,
      selectedMonth,
      activeSignature,
      complianceAlerts
    );
    showNotification('Reporte PDF oficial generado para fiscalización.');
  };

  const handleExportExcel = () => {
    exportOfficialExcel(
      filteredRecords,
      project,
      selectedMonth,
      activeSignature,
      complianceAlerts
    );
    showNotification('Libro Excel (.xlsx) exportado con formato oficial y resumen.');
  };

  const handleAddEorsProvider = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEorsName.trim() || !newEorsRuc.trim() || !newEorsReg.trim()) return;
    const created: EorsProvider = {
      id: `eors-${Date.now()}`,
      razonSocial: newEorsName.trim(),
      ruc: newEorsRuc.trim(),
      registroMinam: newEorsReg.trim(),
      tipoServicio: newEorsService,
      autorizadoPeligrosos: newEorsHazardous,
      vigenciaHasta: '2029-12-31',
      infraestructuraDestino: 'Operador inscrito en padrón autoritativo MINAM',
    };
    setEorsProviders((prev) => [created, ...prev]);
    setNewEorsName('');
    setNewEorsRuc('');
    setNewEorsReg('');
    setNewEorsHazardous(false);
    showNotification('Empresa Operadora (EO-RS) agregada al directorio autorizado.');
  };

  const handleResetDemoData = () => {
    setRecords(INITIAL_WASTE_RECORDS);
    setProject(INITIAL_PROJECT_METADATA);
    setSignatures(INITIAL_SIGNATURES);
    setEorsProviders(INITIAL_EORS_PROVIDERS);
    setSelectedMonth('2026-10');
    setCategoryFilter('ALL');
    setSearchQuery('');
    showNotification('Datos demostrativos restaurados al estado inicial.');
  };

  if (showWelcome) {
    return (
      <WelcomeScreen
        project={project}
        records={records}
        signatures={signatures}
        alerts={complianceAlerts}
        selectedMonth={selectedMonth}
        onSelectMonth={(m) => setSelectedMonth(m)}
        onEnterApp={(initialTab) => {
          if (initialTab) setActiveTab(initialTab);
          setShowWelcome(false);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen flex bg-[#EDF2F0] text-slate-900">
      {/* LEFT SIDEBAR: Minimalist Emerald Green Sidebar with Left Icon Strip & Curved Active Tab (Adapted from Reference) */}
      <aside className="hidden lg:flex w-[265px] shrink-0 bg-[#00A859] text-white select-none no-print relative">
        {/* Far-left narrow darker green icon rail */}
        <div className="w-14 bg-[#038E4B] flex flex-col items-center py-6 gap-6 shrink-0 rounded-r-2xl">
          <button
            type="button"
            onClick={() => setShowWelcome(true)}
            title="Volver a la Pantalla de Inicio"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-white hover:bg-white hover:text-[#00A859] transition-colors cursor-pointer"
          >
            <Home className="h-4 w-4" />
          </button>

          <div className="mt-8 flex flex-col items-center gap-5">
            {SIDEBAR_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  title={item.label}
                  className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-white text-[#00A859] shadow-xs'
                      : 'text-white/80 hover:bg-white/15 hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Sidebar Navigation Column */}
        <div className="flex-1 flex flex-col justify-between py-6 pl-3">
          <div>
            {/* Brand Lockup */}
            <div className="px-3 pb-6">
              <button
                type="button"
                onClick={() => setShowWelcome(true)}
                className="flex items-center gap-2 text-left cursor-pointer"
              >
                <Recycle className="h-6 w-6 text-white shrink-0" />
                <span className="text-lg font-extrabold tracking-tight text-white uppercase">
                  ECOREG CD
                </span>
              </button>
              <div className="mt-4 text-xs font-bold text-white/90">
                Gestión Ambiental
              </div>
            </div>

            {/* Navigation Links with Curved Cutout Active State */}
            <nav className="space-y-1.5">
              {SIDEBAR_ITEMS.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 text-xs transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#EDF2F0] text-[#00A859] font-bold rounded-l-full shadow-2xs'
                        : 'text-white/90 font-medium hover:bg-white/10 rounded-l-full'
                    }`}
                  >
                    <span className="whitespace-nowrap">{item.label}</span>
                    {!isActive && (
                      <ChevronRight className="h-3.5 w-3.5 text-white/70" />
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Quick Action Links below main nav (like Expenses Report / Departments in reference) */}
            <div className="mt-6 px-4 space-y-3 text-xs text-white/85">
              <button
                type="button"
                onClick={handleExportPdf}
                className="block w-full text-left hover:text-white transition-colors cursor-pointer"
              >
                Exportar Reporte PDF
              </button>
              <button
                type="button"
                onClick={handleExportExcel}
                className="block w-full text-left hover:text-white transition-colors cursor-pointer"
              >
                Exportar Libro Excel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (selectedMonth === 'ALL') setSelectedMonth('2026-10');
                  setIsSignatureModalOpen(true);
                }}
                className="block w-full text-left hover:text-white transition-colors cursor-pointer"
              >
                Firma Digital CIP
              </button>
              <button
                type="button"
                onClick={handleResetDemoData}
                className="block w-full text-left text-white/70 hover:text-white transition-colors cursor-pointer pt-2"
              >
                Restaurar Datos Demo
              </button>
            </div>
          </div>

          <div className="px-4 pr-5 text-[11px] text-white/75">
            <div>D.L. N° 1278 · MINAM</div>
            <div className="font-mono mt-0.5">{records.length} partidas activas</div>
          </div>
        </div>
      </aside>

      {/* RIGHT MAIN WORKSPACE VIEWPORT */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Minimalist Top Bar (Adapted from Reference: Search Pill on left, Month/Alerts/Profile/CTA on right) */}
        <header className="px-6 pt-5 pb-3 flex flex-wrap items-center justify-between gap-4 no-print">
          {/* Left Search Input Pill */}
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (activeTab !== 'registro' && e.target.value.trim() !== '') {
                  setActiveTab('registro');
                }
              }}
              placeholder="Buscar residuo, EO-RS o manifiesto..."
              className="w-full rounded-full bg-white pl-4 pr-10 py-2.5 text-xs text-slate-800 placeholder-slate-400 shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-slate-100 focus:border-[#00A859] focus:outline-hidden"
            />
            <Search className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>

          {/* Right Controls: Period Selector, Alert Bell with Green Counter, Responsible Profile & Primary CTA */}
          <div className="flex items-center gap-4 ml-auto">
            {/* Month Filter Dropdown */}
            <div className="flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-slate-100">
              <Calendar className="h-3.5 w-3.5 text-[#00A859]" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                aria-label="Seleccionar mes fiscalizado"
                className="bg-transparent text-xs font-bold text-slate-800 focus:outline-hidden cursor-pointer"
              >
                {availableMonths.map((m) => (
                  <option key={m} value={m}>
                    {formatMonthLabel(m)}
                  </option>
                ))}
                <option value="ALL">Acumulado Anual</option>
              </select>
            </div>

            {/* Functional Compliance Alerts Bell with Green Counter */}
            <button
              type="button"
              onClick={() => setActiveTab('alertas')}
              title="Ver Alertas Legales"
              className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-700 shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-slate-100 hover:border-[#00A859] cursor-pointer"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#00A859] text-[10px] font-bold font-mono text-white">
                {complianceAlerts.length}
              </span>
            </button>

            {/* Responsible Engineer Profile Pill (Clicks to open Digital Signature) */}
            <button
              type="button"
              onClick={() => {
                if (selectedMonth === 'ALL') setSelectedMonth('2026-10');
                setIsSignatureModalOpen(true);
              }}
              title="Firmar Digitalmente Registro del Mes"
              className="hidden sm:flex items-center gap-2.5 rounded-full bg-white pl-1.5 pr-3.5 py-1 shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-slate-100 hover:border-[#00A859] cursor-pointer"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#00A859] text-xs font-bold text-white">
                CM
              </span>
              <span className="text-xs font-semibold text-slate-800 whitespace-nowrap">
                {project.responsableRegistro.split(' ').slice(0, 3).join(' ')}
              </span>
            </button>

            {/* Primary Action Button: Registrar Residuo */}
            <button
              type="button"
              onClick={() => {
                setEditingRecord(null);
                setDefaultModalDate(
                  selectedMonth !== 'ALL' ? `${selectedMonth}-16` : '2026-10-16'
                );
                setIsWasteModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#00A859] px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#059669] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Registrar Residuo
            </button>
          </div>
        </header>

        {/* Mobile Navigation Strip */}
        <div className="flex lg:hidden items-center gap-2 overflow-x-auto px-6 py-2 no-print">
          <button
            type="button"
            onClick={() => setShowWelcome(true)}
            className="px-3 py-1.5 text-xs font-semibold rounded-full bg-white text-slate-700 whitespace-nowrap shrink-0"
          >
            Inicio
          </button>
          {SIDEBAR_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-full whitespace-nowrap shrink-0 ${
                activeTab === item.id
                  ? 'bg-[#00A859] text-white'
                  : 'bg-white text-slate-600'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-full bg-slate-900 px-5 py-3 text-xs font-medium text-white shadow-xl no-print">
            <CheckCircle2 className="h-4 w-4 text-[#00A859] shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Main Content Viewport */}
        <main className="flex-1 px-6 py-4 space-y-6 max-w-[1440px] w-full mx-auto">
          {/* TAB 1: DASHBOARD MINIMALISTA */}
          {activeTab === 'dashboard' && (
            <AnalyticsDashboard
              allRecords={records}
              filteredRecords={filteredRecords}
              selectedMonth={selectedMonth}
              project={project}
              signatures={signatures}
              onSelectMonth={(m) => setSelectedMonth(m)}
              onOpenQuickQuery={() => setActiveTab('consultas')}
              onOpenNewRecordForDate={(dateStr) => {
                setEditingRecord(null);
                setDefaultModalDate(dateStr);
                setIsWasteModalOpen(true);
              }}
              onOpenSignatureModal={() => {
                if (selectedMonth === 'ALL') setSelectedMonth('2026-10');
                setIsSignatureModalOpen(true);
              }}
            />
          )}

          {/* TAB 2: SISTEMA DE CONSULTAS RÁPIDAS */}
          {activeTab === 'consultas' && (
            <QuickQueryEngine
              allRecords={records}
              project={project}
              availableMonths={availableMonths}
              onApplyToGlobalFilter={(month, category) => {
                setSelectedMonth(month);
                setCategoryFilter(category);
                setActiveTab('registro');
              }}
              onExportQueryPdf={async (queriedRecords, periodLabel) => {
                await exportOfficialPdf(
                  queriedRecords,
                  project,
                  periodLabel,
                  signatures[periodLabel],
                  complianceAlerts
                );
                showNotification('PDF exportado con los resultados de tu consulta.');
              }}
              onExportQueryExcel={(queriedRecords, periodLabel) => {
                exportOfficialExcel(
                  queriedRecords,
                  project,
                  periodLabel,
                  signatures[periodLabel],
                  complianceAlerts
                );
                showNotification('Excel exportado con los resultados de tu consulta.');
              }}
            />
          )}

          {/* TAB 3: REGISTRO DIARIO */}
          {activeTab === 'registro' && (
            <div className="space-y-5">
              {/* Filter Bar */}
              <div className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap items-center gap-1.5">
                  {(
                    [
                      ['ALL', 'Todos los Residuos'],
                      ['No Peligroso - Aprovechable', 'Aprovechables'],
                      ['No Peligroso - No Aprovechable', 'No Aprovechables'],
                      ['Peligroso - No Aprovechable', 'Peligrosos (Disp.)'],
                      ['Peligroso - Aprovechable', 'Peligrosos (Valoriz.)'],
                    ] as const
                  ).map(([val, label]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setCategoryFilter(val)}
                      className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        categoryFilter === val
                          ? 'bg-[#00A859] text-white'
                          : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setActiveTab('formato_oficial')}
                    className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-bold text-slate-700 hover:border-[#00A859] hover:text-[#00A859] whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Ver Modelo Oficial Adjunto
                  </button>
                </div>
              </div>

              {/* Minimalist Registry Table Card */}
              <div className="rounded-2xl border border-slate-100 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-6 py-4">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">
                      Registro Interno Diario de Generación y Manejo de Residuos Sólidos
                    </h2>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-0.5">
                      <span>Periodo: {formatMonthLabel(selectedMonth)}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">
                        {filteredRecords.length} partidas
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">
                        Volumen: {totalVolume.toFixed(2)} m³
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums font-bold text-[#00A859]">
                        Masa Total: {(totalWeightKg / 1000).toFixed(2)} t (
                        {totalWeightKg.toLocaleString('es-PE')} kg)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {activeSignature ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#00A859]">
                        <ShieldCheck className="h-4 w-4" />
                        Firmado · <span className="font-mono">{activeSignature.verificationHash}</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsSignatureModalOpen(true)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 hover:underline cursor-pointer"
                      >
                        <AlertTriangle className="h-4 w-4" />
                        Pendiente de Firma Mensual (Clic para firmar)
                      </button>
                    )}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-600">
                        <th className="px-4 py-3.5 font-bold text-center w-12">Ítem</th>
                        <th className="px-4 py-3.5 font-bold w-24">Fecha</th>
                        <th className="px-4 py-3.5 font-bold">Nombre de residuo</th>
                        <th className="px-4 py-3.5 font-bold">Tipo de Residuo</th>
                        <th className="px-4 py-3.5 font-bold text-right">Volumen</th>
                        <th className="px-4 py-3.5 font-bold text-right">Peso</th>
                        <th className="px-4 py-3.5 font-bold">EO-RS Transporta</th>
                        <th className="px-4 py-3.5 font-bold">
                          EO-RS de Disposición Final o Valorización
                        </th>
                        <th className="px-4 py-3.5 font-bold text-right w-24">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredRecords.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="px-6 py-12 text-center">
                            <div className="mx-auto max-w-md space-y-2">
                              <div className="text-sm font-semibold text-slate-800">
                                Sin registros para el filtro actual
                              </div>
                              <p className="text-xs text-slate-400">
                                Registre una nueva partida diaria o seleccione otro mes en la barra superior.
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredRecords.map((rec, index) => {
                          const isHazardous = rec.tipoResiduo.startsWith('Peligroso');
                          return (
                            <tr
                              key={rec.id}
                              className="transition-colors hover:bg-emerald-50/30"
                            >
                              <td className="px-4 py-3.5 text-center font-mono tabular-nums text-slate-400">
                                {String(index + 1).padStart(2, '0')}
                              </td>
                              <td className="px-4 py-3.5 font-mono tabular-nums text-slate-800 whitespace-nowrap">
                                {rec.fecha}
                              </td>
                              <td className="px-4 py-3.5">
                                <div className="font-semibold text-slate-900">
                                  {rec.nombreResiduo}
                                </div>
                                {rec.frenteTrabajo && (
                                  <div className="text-[11px] text-slate-400 mt-0.5">
                                    {rec.frenteTrabajo}
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-3.5 whitespace-nowrap">
                                <span
                                  className={`font-semibold ${
                                    isHazardous
                                      ? 'text-red-600'
                                      : rec.tipoResiduo.includes('Aprovechable')
                                      ? 'text-[#00A859]'
                                      : 'text-slate-600'
                                  }`}
                                >
                                  {rec.tipoResiduo}
                                </span>
                              </td>
                              <td className="px-4 py-3.5 text-right font-mono tabular-nums font-medium text-slate-800 whitespace-nowrap">
                                {rec.volumenM3.toFixed(2)} m³
                              </td>
                              <td className="px-4 py-3.5 text-right font-mono tabular-nums whitespace-nowrap">
                                <div className="font-bold text-slate-900">
                                  {rec.pesoKg.toLocaleString('es-PE')} kg
                                </div>
                                <div className="text-[11px] text-[#00A859] font-semibold">
                                  {(rec.pesoKg / 1000).toFixed(2)} t
                                </div>
                              </td>
                              <td className="px-4 py-3.5">
                                <div className="text-slate-800">{rec.eorsTransporta}</div>
                                <div className="mt-0.5 text-[11px] font-mono">
                                  {rec.nroManifiestoGuia ? (
                                    <span className="text-slate-400">
                                      Doc: {rec.nroManifiestoGuia}
                                    </span>
                                  ) : (
                                    <span className="text-red-600 font-semibold">
                                      Sin Manifiesto
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3.5">
                                <div className="text-slate-800">
                                  {rec.eorsDisposicionFinal}
                                </div>
                                <div className="mt-0.5 text-[11px] text-slate-400">
                                  {rec.estadoEvacuacion}
                                </div>
                              </td>
                              <td className="px-4 py-3.5 text-right whitespace-nowrap">
                                <div className="inline-flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingRecord(rec);
                                      setIsWasteModalOpen(true);
                                    }}
                                    className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-900"
                                    title="Editar partida"
                                  >
                                    <Edit2 className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteRecord(rec.id)}
                                    className="rounded-full p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                                    title="Eliminar partida"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: FORMATO OFICIAL Y FIRMA DIGITAL */}
          {activeTab === 'formato_oficial' && (
            <OfficialRegistryFormatView
              records={filteredRecords}
              project={project}
              onUpdateProject={(updated) => {
                setProject(updated);
                showNotification('Cabecera oficial del proyecto actualizada.');
              }}
              selectedMonth={selectedMonth}
              signature={activeSignature}
              onOpenSignatureModal={() => {
                if (selectedMonth === 'ALL') setSelectedMonth('2026-10');
                setIsSignatureModalOpen(true);
              }}
              onExportPdf={handleExportPdf}
              onExportExcel={handleExportExcel}
              alerts={complianceAlerts}
            />
          )}

          {/* TAB 5: ALERTAS LEGALES */}
          {activeTab === 'alertas' && (
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Alertas Legales ante Posibles Incumplimientos Normativos
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Evaluación automática sobre {formatMonthLabel(selectedMonth)} conforme a D.L. N° 1278 y D.S. N° 002-2022-VIVIENDA
                  </p>
                </div>

                {complianceAlerts.length === 0 ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#00A859]">
                    <ShieldCheck className="h-5 w-5" />
                    100% Conforme para Fiscalización
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600">
                    <ShieldAlert className="h-5 w-5" />
                    {complianceAlerts.length} observación(es) detectada(s)
                  </span>
                )}
              </div>

              {complianceAlerts.length === 0 ? (
                <div className="py-10 text-center space-y-2">
                  <ShieldCheck className="mx-auto h-10 w-10 text-[#00A859]" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Expediente sin observaciones legales en {formatMonthLabel(selectedMonth)}
                  </h3>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {complianceAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="py-5 first:pt-0 last:pb-0 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
                    >
                      <div className="space-y-1 max-w-3xl">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span
                            className={`font-bold ${
                              alert.severity === 'Crítico'
                                ? 'text-red-600'
                                : 'text-amber-600'
                            }`}
                          >
                            {alert.severity}
                          </span>
                          <span>·</span>
                          <span className="font-mono text-slate-500">
                            {alert.normativaRef}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-900">
                          {alert.title}
                        </h3>
                        <p className="text-xs text-slate-500">{alert.description}</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleResolveAlertAction(alert)}
                        className="rounded-full bg-[#00A859] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#059669] whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        {alert.actionLabel}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: DIRECTORIO EO-RS */}
          {activeTab === 'directorio_eors' && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              <div className="lg:col-span-8 rounded-2xl border border-slate-100 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">
                <div className="border-b border-slate-100 px-6 py-4">
                  <h2 className="text-sm font-bold text-slate-900">
                    Empresas Operadoras de Residuos Sólidos (EO-RS) Autorizadas
                  </h2>
                  <p className="text-xs text-slate-400">
                    Padrón vigente ante el MINAM vinculado al proyecto
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-600">
                        <th className="px-5 py-3.5 font-semibold">Razón Social / RUC</th>
                        <th className="px-5 py-3.5 font-semibold">N° Registro MINAM</th>
                        <th className="px-5 py-3.5 font-semibold">Operación</th>
                        <th className="px-5 py-3.5 font-semibold">Alcance</th>
                        <th className="px-5 py-3.5 font-semibold text-right">Vigencia</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {eorsProviders.map((prov) => (
                        <tr key={prov.id} className="hover:bg-slate-50">
                          <td className="px-5 py-3.5">
                            <div className="font-semibold text-slate-900">
                              {prov.razonSocial}
                            </div>
                            <div className="text-[11px] font-mono text-slate-400">
                              RUC: {prov.ruc}
                            </div>
                          </td>
                          <td className="px-5 py-3.5 font-mono text-slate-700">
                            {prov.registroMinam}
                          </td>
                          <td className="px-5 py-3.5 text-slate-600">
                            {prov.tipoServicio}
                          </td>
                          <td className="px-5 py-3.5">
                            <span
                              className={
                                prov.autorizadoPeligrosos
                                  ? 'font-semibold text-[#00A859]'
                                  : 'text-slate-500'
                              }
                            >
                              {prov.autorizadoPeligrosos
                                ? 'Peligrosos y No Peligrosos'
                                : 'Solo No Peligrosos'}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right font-mono tabular-nums text-slate-600">
                            {prov.vigenciaHasta}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="lg:col-span-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] h-fit">
                <h3 className="text-sm font-bold text-slate-900">
                  Acreditar Nueva EO-RS
                </h3>
                <form onSubmit={handleAddEorsProvider} className="mt-4 space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Razón Social *
                    </label>
                    <input
                      type="text"
                      required
                      value={newEorsName}
                      onChange={(e) => setNewEorsName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      RUC *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={11}
                      value={newEorsRuc}
                      onChange={(e) => setNewEorsRuc(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-mono text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Código Registro MINAM *
                    </label>
                    <input
                      type="text"
                      required
                      value={newEorsReg}
                      onChange={(e) => setNewEorsReg(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-mono text-slate-900"
                    />
                  </div>
                  <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={newEorsHazardous}
                      onChange={(e) => setNewEorsHazardous(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-[#00A859]"
                    />
                    <span>Habilitada para Residuos Peligrosos</span>
                  </label>
                  <button
                    type="submit"
                    className="w-full rounded-full bg-[#00A859] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#059669]"
                  >
                    Agregar al Padrón
                  </button>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      <WasteFormModal
        isOpen={isWasteModalOpen}
        onClose={() => {
          setIsWasteModalOpen(false);
          setEditingRecord(null);
        }}
        onSave={handleSaveWasteRecord}
        initialRecord={editingRecord}
        eorsProviders={eorsProviders}
        defaultDate={defaultModalDate}
      />

      <SignatureModal
        isOpen={isSignatureModalOpen}
        onClose={() => setIsSignatureModalOpen(false)}
        targetMonth={selectedMonth === 'ALL' ? '2026-10' : selectedMonth}
        project={project}
        existingSignature={activeSignature}
        onSaveSignature={handleSaveSignature}
        recordCount={monthRecords.length}
        totalWeightKg={totalWeightKg}
      />
    </div>
  );
}
