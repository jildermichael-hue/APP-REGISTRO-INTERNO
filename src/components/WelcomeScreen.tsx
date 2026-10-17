import React, { useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  Calendar,
  Eye,
  FolderKanban,
  PenTool,
  Recycle,
  Search,
  ShieldCheck,
} from 'lucide-react';
import {
  ComplianceAlert,
  MonthlySignature,
  ProjectMetadata,
  WasteRecord,
} from '../types/waste';
import { formatMonthLabel } from '../utils/complianceEngine';

type TargetModule =
  | 'dashboard'
  | 'consultas'
  | 'registro'
  | 'formato_oficial'
  | 'alertas';

interface WelcomeScreenProps {
  project: ProjectMetadata;
  records: WasteRecord[];
  signatures: Record<string, MonthlySignature>;
  alerts: ComplianceAlert[];
  selectedMonth: string;
  onSelectMonth: (month: string) => void;
  onEnterApp: (initialTab?: TargetModule) => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  project,
  records,
  selectedMonth,
  onSelectMonth,
  onEnterApp,
}) => {
  const [targetModule, setTargetModule] = useState<TargetModule>('dashboard');

  const monthRecords =
    selectedMonth === 'ALL'
      ? records
      : records.filter((r) => r.fecha.startsWith(selectedMonth));
  const monthWeightKg = monthRecords.reduce((s, r) => s + r.pesoKg, 0);
  const monthTons = monthWeightKg / 1000;
  const monthVolumeM3 = monthRecords.reduce((s, r) => s + r.volumenM3, 0);

  return (
    <div className="min-h-screen w-full bg-[#070B09] flex items-center justify-center p-4 sm:p-6 lg:p-10 selection:bg-emerald-500 selection:text-black">
      {/* Outer Framed Split Card following the reference model */}
      <div className="w-full max-w-[1160px] min-h-[650px] rounded-[38px] bg-white p-[6px] shadow-[0_25px_70px_rgba(0,0,0,0.75)] flex">
        <div className="w-full rounded-[32px] bg-[#09140E] overflow-hidden flex flex-col lg:flex-row relative">
          {/* LEFT PANEL: Enterprise Generating Solid Waste + Inspector with iPad Registering It */}
          <div className="relative w-full lg:w-[50%] min-h-[400px] lg:min-h-[640px] bg-[#09140E] overflow-hidden flex flex-col justify-between p-8 sm:p-10 select-none">
            {/* Top-left condensed uppercase brand title */}
            <div className="relative z-20">
              <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white uppercase leading-none">
                ECOREG CD
              </div>
              <div className="mt-1 text-[11px] font-mono tracking-wider text-emerald-400 uppercase">
                CONTROL DIGITAL DE RESIDUOS EN OBRA E INDUSTRIA
              </div>
            </div>

            {/* Thematic Illustration: Industrial/Construction Company Generating Waste + Inspector Registering on iPad */}
            <div className="absolute inset-0 z-10 pointer-events-none">
              <svg
                viewBox="0 0 620 700"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="h-full w-full object-cover"
                preserveAspectRatio="xMidYMid slice"
              >
                <defs>
                  <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#06100B" />
                    <stop offset="50%" stopColor="#0D261B" />
                    <stop offset="100%" stopColor="#07120D" />
                  </linearGradient>

                  <radialGradient id="ipadGlow" cx="62%" cy="62%" r="45%">
                    <stop offset="0%" stopColor="#34D399" stopOpacity="0.6" />
                    <stop offset="50%" stopColor="#10B981" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#059669" stopOpacity="0" />
                  </radialGradient>

                  <linearGradient id="buildingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#112A1F" />
                    <stop offset="100%" stopColor="#08150F" />
                  </linearGradient>

                  <linearGradient id="screenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ECFDF5" />
                    <stop offset="100%" stopColor="#A7F3D0" />
                  </linearGradient>
                </defs>

                {/* Sky / Industrial Backdrop */}
                <rect width="620" height="700" fill="url(#skyGrad)" />

                {/* Background Grid & Telemetry Radar Waves */}
                <g opacity="0.15" stroke="#34D399" strokeWidth="1">
                  <line x1="0" y1="180" x2="620" y2="180" strokeDasharray="4 6" />
                  <line x1="0" y1="280" x2="620" y2="280" strokeDasharray="4 6" />
                  <line x1="0" y1="380" x2="620" y2="380" strokeDasharray="4 6" />
                  <line x1="160" y1="0" x2="160" y2="700" strokeDasharray="4 6" />
                  <line x1="340" y1="0" x2="340" y2="700" strokeDasharray="4 6" />
                </g>

                {/* INDUSTRIAL / CONSTRUCTION COMPANY COMPLEX (Left & Center Background) */}
                <g>
                  {/* Tower Crane in Construction Site */}
                  <line x1="115" y1="85" x2="115" y2="310" stroke="#10B981" strokeWidth="5" strokeOpacity="0.55" />
                  <line x1="45" y1="102" x2="275" y2="102" stroke="#34D399" strokeWidth="4" strokeOpacity="0.65" />
                  <line x1="115" y1="85" x2="215" y2="102" stroke="#10B981" strokeWidth="2" strokeOpacity="0.5" />
                  <line x1="230" y1="102" x2="230" y2="165" stroke="#6EE7B7" strokeWidth="2" strokeDasharray="3 3" />
                  <rect x="218" y="165" width="24" height="16" rx="3" fill="#F59E0B" />

                  {/* Main Enterprise Plant / Building Generating Waste */}
                  <rect
                    x="35"
                    y="175"
                    width="195"
                    height="245"
                    rx="6"
                    fill="url(#buildingGrad)"
                    stroke="#059669"
                    strokeWidth="2"
                  />
                  {/* Sawtooth Industrial Factory Roof */}
                  <polygon
                    points="230,245 285,215 285,245 340,215 340,245 395,215 395,420 230,420"
                    fill="#0C2118"
                    stroke="#059669"
                    strokeWidth="2"
                  />

                  {/* Company Sign on Building */}
                  <rect x="52" y="192" width="125" height="24" rx="4" fill="#064E3B" stroke="#34D399" strokeWidth="1.2" />
                  <text x="114" y="208" fill="#FFFFFF" fontSize="10" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">
                    PLANTA / OBRA RCD
                  </text>

                  {/* Illuminated Building Windows */}
                  <g fill="#34D399" fillOpacity="0.28">
                    <rect x="55" y="232" width="32" height="22" rx="2" />
                    <rect x="98" y="232" width="32" height="22" rx="2" />
                    <rect x="142" y="232" width="32" height="22" rx="2" />
                    <rect x="55" y="266" width="32" height="22" rx="2" />
                    <rect x="98" y="266" width="32" height="22" rx="2" />
                    <rect x="142" y="266" width="32" height="22" rx="2" />
                  </g>

                  {/* Waste Discharge Chute / Conveyor Coming Out of the Company Building */}
                  <path
                    d="M190 305 L285 355 L285 378 L190 328 Z"
                    fill="#047857"
                    stroke="#6EE7B7"
                    strokeWidth="2"
                  />
                  {/* Solid Waste Materials Falling / Being Segregated from the Chute */}
                  <polygon points="292,368 304,362 308,374 295,378" fill="#CBD5E1" />
                  <polygon points="312,378 324,374 320,386 308,385" fill="#F59E0B" />
                  <circle cx="298" cy="390" r="5" fill="#34D399" />
                  <rect x="315" y="390" width="10" height="8" rx="1" fill="#94A3B8" transform="rotate(18 315 390)" />
                </g>

                {/* ACOPIO TEMPORAL: SEGREGATED SOLID WASTE CONTAINERS (NTP 900.058) */}
                <g>
                  {/* Ground Platform */}
                  <rect x="0" y="420" width="620" height="280" fill="#060F0B" />
                  <line x1="0" y1="420" x2="620" y2="420" stroke="#059669" strokeWidth="2.5" />

                  {/* Container 1: Green Bin (Aprovechables / Valorizables) */}
                  <g transform="translate(42, 362)">
                    {/* Pile of valorizable wood/concrete/plastic inside */}
                    <polygon points="10,18 32,4 58,12 78,2 95,18" fill="#34D399" opacity="0.85" />
                    <polygon
                      points="0,18 105,18 95,88 10,88"
                      fill="#059669"
                      stroke="#A7F3D0"
                      strokeWidth="2.5"
                    />
                    <rect x="16" y="34" width="72" height="22" rx="4" fill="#064E3B" />
                    <text x="52" y="49" fill="#FFFFFF" fontSize="9.5" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                      VALORIZABLE
                    </text>
                    <text x="52" y="74" fill="#A7F3D0" fontSize="10" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                      84.2 t · m³
                    </text>
                  </g>

                  {/* Container 2: Yellow/Dark Bin (Metales y Acero Residual) */}
                  <g transform="translate(162, 372)">
                    <polygon points="12,16 35,2 62,14 82,4 92,16" fill="#FBBF24" opacity="0.9" />
                    <polygon
                      points="0,16 100,16 92,78 8,78"
                      fill="#1E293B"
                      stroke="#F59E0B"
                      strokeWidth="2.5"
                    />
                    <text x="50" y="44" fill="#FDE68A" fontSize="9" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                      METALES / RCD
                    </text>
                    <text x="50" y="64" fill="#FFFFFF" fontSize="9.5" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                      34.2 t
                    </text>
                  </g>

                  {/* Container 3: Red Bin (Residuos Peligrosos SIGERSOL) */}
                  <g transform="translate(276, 380)">
                    <polygon points="10,14 40,3 72,14" fill="#F87171" opacity="0.85" />
                    <polygon
                      points="0,14 86,14 80,70 6,70"
                      fill="#7F1D1D"
                      stroke="#FCA5A5"
                      strokeWidth="2"
                    />
                    <text x="43" y="40" fill="#FECACA" fontSize="8.5" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                      PELIGROSOS
                    </text>
                    <text x="43" y="56" fill="#FFFFFF" fontSize="9" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                      1.66 t
                    </text>
                  </g>
                </g>

                {/* WIRELESS SCANNING BEAMS FROM WASTE CONTAINERS TO THE ENGINEER'S IPAD */}
                <g>
                  <circle cx="385" cy="445" r="220" fill="url(#ipadGlow)" />
                  <path
                    d="M95 395 Q 230 330 355 445"
                    stroke="#34D399"
                    strokeWidth="2.5"
                    strokeDasharray="6 6"
                  />
                  <path
                    d="M212 400 Q 285 365 362 452"
                    stroke="#6EE7B7"
                    strokeWidth="2"
                    strokeDasharray="5 5"
                  />
                  <path
                    d="M320 410 Q 345 415 370 458"
                    stroke="#FDE68A"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                  />
                  {/* Floating Digital Verification Nodes */}
                  <circle cx="95" cy="395" r="6" fill="#10B981" stroke="#FFFFFF" strokeWidth="2" />
                  <circle cx="212" cy="400" r="6" fill="#F59E0B" stroke="#FFFFFF" strokeWidth="2" />
                  <circle cx="320" cy="410" r="6" fill="#EF4444" stroke="#FFFFFF" strokeWidth="2" />
                </g>

                {/* FOREGROUND: ENVIRONMENTAL ENGINEER / INSPECTOR HOLDING AN IPAD REGISTERING THE WASTE */}
                <g>
                  {/* Engineer Torso & High-Visibility Safety Vest */}
                  <path
                    d="M395 695 L412 485 C418 450, 488 448, 505 485 L535 695 Z"
                    fill="#064E3B"
                    stroke="#10B981"
                    strokeWidth="2.5"
                  />
                  {/* Reflective Safety Stripes on Vest */}
                  <path d="M428 472 L422 595" stroke="#34D399" strokeWidth="8" />
                  <path d="M486 472 L492 595" stroke="#34D399" strokeWidth="8" />
                  <path d="M412 555 L508 555" stroke="#A7F3D0" strokeWidth="9" />

                  {/* Engineer Head & White/Green Safety Hardhat */}
                  <circle cx="458" cy="402" r="34" fill="#FDE68A" />
                  {/* Safety Glasses */}
                  <rect
                    x="420"
                    y="392"
                    width="34"
                    height="16"
                    rx="5"
                    fill="#34D399"
                    fillOpacity="0.55"
                    stroke="#FFFFFF"
                    strokeWidth="2.5"
                  />
                  {/* Safety Helmet (Casco de Ingeniero SSOMA) */}
                  <path
                    d="M414 390 C414 352, 502 352, 502 390 Z"
                    fill="#FFFFFF"
                    stroke="#10B981"
                    strokeWidth="3"
                  />
                  <path
                    d="M402 390 L508 390"
                    stroke="#059669"
                    strokeWidth="6"
                    strokeLinecap="round"
                  />
                  {/* Green Cross / Emblem on Helmet */}
                  <rect x="448" y="364" width="16" height="16" rx="4" fill="#059669" />

                  {/* THE IPAD / DIGITAL TABLET HELD IN HANDS (Glowing Screen Registering Waste) */}
                  <g transform="rotate(-10 355 478)">
                    {/* Tablet Body */}
                    <rect
                      x="265"
                      y="418"
                      width="158"
                      height="116"
                      rx="12"
                      fill="#0F172A"
                      stroke="#FFFFFF"
                      strokeWidth="4"
                    />
                    {/* Glowing iPad Screen */}
                    <rect
                      x="273"
                      y="426"
                      width="142"
                      height="100"
                      rx="7"
                      fill="url(#screenGrad)"
                    />
                    {/* iPad App Header */}
                    <rect x="273" y="426" width="142" height="20" rx="5" fill="#059669" />
                    <text x="282" y="439" fill="#FFFFFF" fontSize="8.5" fontWeight="bold" fontFamily="monospace">
                      IPAD · REGISTRO RCD
                    </text>
                    {/* Checkmark Rows on iPad Screen */}
                    <rect x="282" y="454" width="124" height="16" rx="4" fill="#FFFFFF" stroke="#10B981" strokeWidth="1.2" />
                    <circle cx="291" cy="462" r="4.5" fill="#059669" />
                    <rect x="300" y="459" width="58" height="6" rx="2" fill="#0F172A" />
                    <text x="398" y="465" fill="#059669" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="end">
                      +45.0 m³
                    </text>

                    <rect x="282" y="475" width="124" height="16" rx="4" fill="#FFFFFF" stroke="#10B981" strokeWidth="1.2" />
                    <circle cx="291" cy="483" r="4.5" fill="#059669" />
                    <rect x="300" y="480" width="52" height="6" rx="2" fill="#0F172A" />
                    <text x="398" y="486" fill="#059669" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="end">
                      +34.2 t
                    </text>

                    <rect x="282" y="496" width="124" height="20" rx="5" fill="#059669" />
                    <text x="344" y="509" fill="#FFFFFF" fontSize="8.5" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">
                      ✓ FIRMADO Y REGISTRADO
                    </text>
                  </g>

                  {/* Engineer Arm & Hand Holding the iPad & Stylus */}
                  <path
                    d="M452 505 L385 522 L345 495"
                    stroke="#047857"
                    strokeWidth="26"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="342" cy="492" r="14" fill="#FDE68A" />
                  {/* Apple Pencil / Digital Stylus touching the iPad */}
                  <line
                    x1="322"
                    y1="462"
                    x2="355"
                    y2="495"
                    stroke="#FFFFFF"
                    strokeWidth="4.5"
                    strokeLinecap="round"
                  />
                </g>
              </svg>
            </div>

            {/* Bottom-left live telemetry badge over the illustration */}
            <div className="relative z-20 mt-auto pt-6">
              <div className="inline-flex items-center gap-3 rounded-2xl border border-emerald-500/40 bg-black/80 px-4 py-3 backdrop-blur-md">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-black font-bold shrink-0">
                  <Recycle className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-[11px] font-medium text-emerald-400">
                    Empresa Registrando en Tiempo Real · D.L. N° 1278
                  </div>
                  <div className="text-xs font-bold text-white font-mono">
                    {monthTons.toFixed(2)} t ({monthVolumeM3.toFixed(1)} m³) en {formatMonthLabel(selectedMonth)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL: Curved White Card Overlapping the Artwork (Minimalist Entry, NO Registration) */}
          <div className="w-full lg:w-[53%] lg:-ml-8 relative z-30 bg-white rounded-[32px] lg:rounded-l-[42px] px-7 py-10 sm:px-12 sm:py-12 flex flex-col justify-center items-center text-slate-900 shadow-[-15px_0_40px_rgba(0,0,0,0.35)]">
            <div className="w-full max-w-[390px] space-y-5">
              <div className="text-center space-y-1.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950">
                  Bienvenido a EcoReg CD
                </h1>
                <p className="text-xs text-slate-500">
                  Sistema Digital de Registro Interno y Fiscalización de Residuos Sólidos
                </p>
              </div>

              {/* Top Quick Query Pill Button */}
              <button
                type="button"
                onClick={() => onEnterApp('consultas')}
                className="w-full flex items-center justify-center gap-2.5 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-800 shadow-2xs hover:border-[#059669] hover:bg-emerald-50/30 transition-all cursor-pointer"
              >
                <span>Consultar Generación de Residuos por Mes</span>
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#059669] text-white">
                  <Search className="h-3 w-3" />
                </span>
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-xs font-medium text-slate-400">
                  parámetros de ingreso
                </span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              {/* Three Stacked Rounded Interactive Selectors */}
              <div className="space-y-3.5">
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-left transition-colors hover:border-slate-300">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-400">
                      Empresa / Proyecto Generador
                    </span>
                    <FolderKanban className="h-3.5 w-3.5 text-[#059669]" />
                  </div>
                  <div className="mt-0.5 text-xs font-bold text-slate-900 truncate">
                    {project.empresaQueRegistra}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-left focus-within:border-[#059669] hover:border-slate-300 transition-colors">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="welcome-month-select"
                      className="text-[11px] font-semibold text-slate-400"
                    >
                      Mes de Control (Cálculo Inmediato)
                    </label>
                    <Calendar className="h-3.5 w-3.5 text-[#059669]" />
                  </div>
                  <select
                    id="welcome-month-select"
                    value={selectedMonth}
                    onChange={(e) => onSelectMonth(e.target.value)}
                    className="mt-0.5 w-full bg-transparent text-xs font-bold text-slate-900 focus:outline-hidden cursor-pointer"
                  >
                    <option value="2026-10">
                      Octubre 2026 — 136.12 t generadas (7 partidas)
                    </option>
                    <option value="2026-09">
                      Septiembre 2026 — 170.63 t generadas (Firmado CIP)
                    </option>
                    <option value="2026-08">
                      Agosto 2026 — 139.84 t generadas (Firmado CIP)
                    </option>
                    <option value="ALL">
                      Acumulado Anual 2026 — {(records.reduce((s, r) => s + r.pesoKg, 0) / 1000).toFixed(2)} t totales
                    </option>
                  </select>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-left focus-within:border-[#059669] hover:border-slate-300 transition-colors">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="welcome-module-select"
                      className="text-[11px] font-semibold text-slate-400"
                    >
                      Vista Inicial del Sistema
                    </label>
                    <Eye className="h-4 w-4 text-slate-400" />
                  </div>
                  <select
                    id="welcome-module-select"
                    value={targetModule}
                    onChange={(e) => setTargetModule(e.target.value as TargetModule)}
                    className="mt-0.5 w-full bg-transparent text-xs font-bold text-slate-900 focus:outline-hidden cursor-pointer"
                  >
                    <option value="dashboard">
                      Dashboard Minimalista de Residuos
                    </option>
                    <option value="consultas">
                      Consultor Rápido por Mes y Tipo
                    </option>
                    <option value="registro">
                      Registro Interno Diario de Obra
                    </option>
                    <option value="formato_oficial">
                      Formato Oficial PDF/Excel y Firma Digital
                    </option>
                    <option value="alertas">
                      Alertas de Cumplimiento Legal OEFA
                    </option>
                  </select>
                </div>
              </div>

              {/* Primary Pill CTA Button */}
              <button
                type="button"
                onClick={() => onEnterApp(targetModule)}
                className="w-full rounded-full bg-[#00A859] hover:bg-[#059669] active:scale-[0.99] py-3.5 px-6 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Ingresar al Sistema</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <div className="text-center text-xs text-slate-500">
                ¿Necesitas exportar el registro para fiscalización?{' '}
                <button
                  type="button"
                  onClick={() => onEnterApp('formato_oficial')}
                  className="font-bold text-[#00A859] hover:underline cursor-pointer"
                >
                  Ver Formato Oficial
                </button>
              </div>

              {/* Bottom 4 Circular Module Icons */}
              <div className="pt-2 flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => onEnterApp('dashboard')}
                  title="Dashboard Minimalista"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-white hover:bg-[#00A859] transition-colors cursor-pointer"
                >
                  <BarChart3 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onEnterApp('consultas')}
                  title="Consultas Rápidas"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-white hover:bg-[#00A859] transition-colors cursor-pointer"
                >
                  <Search className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onEnterApp('formato_oficial')}
                  title="Firma Digital y Exportación"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-white hover:bg-[#00A859] transition-colors cursor-pointer"
                >
                  <PenTool className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onEnterApp('alertas')}
                  title="Alertas Legales"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-white hover:bg-[#00A859] transition-colors cursor-pointer"
                >
                  <ShieldCheck className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
