import React, { useEffect, useState } from 'react';
import { AlertTriangle, Calculator, Check, Sparkles, X } from 'lucide-react';
import { WASTE_CATALOG_TEMPLATES } from '../data/initialData';
import {
  EorsProvider,
  EvacuationStatus,
  WasteCategory,
  WasteRecord,
} from '../types/waste';

interface WasteFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: Omit<WasteRecord, 'id'>, existingId?: string) => void;
  initialRecord?: WasteRecord | null;
  eorsProviders: EorsProvider[];
  defaultDate?: string;
}

const WASTE_CATEGORIES: WasteCategory[] = [
  'No Peligroso - Aprovechable',
  'No Peligroso - No Aprovechable',
  'Peligroso - Aprovechable',
  'Peligroso - No Aprovechable',
];

const EVACUATION_STATUSES: EvacuationStatus[] = [
  'Evacuado con Certificado',
  'En Tránsito (EO-RS)',
  'Acopio Temporal en Obra',
];

export const WasteFormModal: React.FC<WasteFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialRecord,
  eorsProviders,
  defaultDate,
}) => {
  const [fecha, setFecha] = useState(defaultDate || '2026-10-16');
  const [nombreResiduo, setNombreResiduo] = useState('');
  const [tipoResiduo, setTipoResiduo] = useState<WasteCategory>('No Peligroso - Aprovechable');
  const [volumenM3, setVolumenM3] = useState<string>('10.0');
  const [pesoKg, setPesoKg] = useState<string>('16000');
  const [densidadRef, setDensidadRef] = useState<number>(1600);
  const [eorsTransporta, setEorsTransporta] = useState('');
  const [eorsDisposicionFinal, setEorsDisposicionFinal] = useState('');
  const [nroManifiestoGuia, setNroManifiestoGuia] = useState('');
  const [certificadoDisposicion, setCertificadoDisposicion] = useState(true);
  const [estadoEvacuacion, setEstadoEvacuacion] = useState<EvacuationStatus>(
    'Evacuado con Certificado'
  );
  const [frenteTrabajo, setFrenteTrabajo] = useState('Sector A - Obra Principal');
  const [observaciones, setObservaciones] = useState('');

  const transportProviders = eorsProviders.filter(
    (p) => p.tipoServicio === 'Transporte' || p.tipoServicio.includes('Integral')
  );
  const disposalProviders = eorsProviders.filter(
    (p) => p.tipoServicio !== 'Transporte'
  );

  useEffect(() => {
    if (!isOpen) return;
    if (initialRecord) {
      setFecha(initialRecord.fecha);
      setNombreResiduo(initialRecord.nombreResiduo);
      setTipoResiduo(initialRecord.tipoResiduo);
      setVolumenM3(String(initialRecord.volumenM3));
      setPesoKg(String(initialRecord.pesoKg));
      setEorsTransporta(initialRecord.eorsTransporta);
      setEorsDisposicionFinal(initialRecord.eorsDisposicionFinal);
      setNroManifiestoGuia(initialRecord.nroManifiestoGuia);
      setCertificadoDisposicion(initialRecord.certificadoDisposicion);
      setEstadoEvacuacion(initialRecord.estadoEvacuacion);
      setFrenteTrabajo(initialRecord.frenteTrabajo || '');
      setObservaciones(initialRecord.observaciones || '');
    } else {
      setFecha(defaultDate || '2026-10-16');
      const tpl = WASTE_CATALOG_TEMPLATES[0];
      setNombreResiduo(tpl.nombreResiduo);
      setTipoResiduo(tpl.tipoResiduo);
      setDensidadRef(tpl.densidadKgM3);
      setVolumenM3('12.0');
      setPesoKg(String(12 * tpl.densidadKgM3));
      setEorsTransporta(
        transportProviders[0]
          ? `${transportProviders[0].razonSocial} (${transportProviders[0].registroMinam.slice(0, 16)})`
          : ''
      );
      setEorsDisposicionFinal(tpl.destinoSugerido);
      setNroManifiestoGuia(`GR-004-00${Math.floor(1900 + Math.random() * 90)}`);
      setCertificadoDisposicion(true);
      setEstadoEvacuacion('Evacuado con Certificado');
      setFrenteTrabajo('Sector Principal - Frente de Obra');
      setObservaciones('');
    }
  }, [isOpen, initialRecord, defaultDate]);

  if (!isOpen) return null;

  const handleApplyTemplate = (index: number) => {
    const tpl = WASTE_CATALOG_TEMPLATES[index];
    if (!tpl) return;
    setNombreResiduo(tpl.nombreResiduo);
    setTipoResiduo(tpl.tipoResiduo);
    setDensidadRef(tpl.densidadKgM3);
    const vol = parseFloat(volumenM3) || 1;
    setPesoKg(String(Math.round(vol * tpl.densidadKgM3)));
    setEorsDisposicionFinal(tpl.destinoSugerido);

    if (tpl.tipoResiduo.startsWith('Peligroso')) {
      const hazTransport = transportProviders.find((p) => p.autorizadoPeligrosos);
      if (hazTransport) {
        setEorsTransporta(
          `${hazTransport.razonSocial} (${hazTransport.registroMinam.slice(0, 16)})`
        );
      }
      if (!nroManifiestoGuia.startsWith('MAN-PEL')) {
        setNroManifiestoGuia(`MAN-PEL-2026-00${Math.floor(900 + Math.random() * 95)}`);
      }
    }
  };

  const handleVolumeChange = (val: string) => {
    setVolumenM3(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0) {
      setPesoKg(String(Math.round(num * densidadRef)));
    }
  };

  const isHazardous = tipoResiduo.startsWith('Peligroso');
  const missingHazardousManifest = isHazardous && !nroManifiestoGuia.trim();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const vol = Math.max(0.01, parseFloat(volumenM3) || 0);
    const weight = Math.max(0.1, parseFloat(pesoKg) || 0);

    onSave(
      {
        fecha,
        nombreResiduo: nombreResiduo.trim(),
        tipoResiduo,
        volumenM3: vol,
        pesoKg: weight,
        eorsTransporta: eorsTransporta.trim() || 'Pendiente de asignación EO-RS',
        eorsDisposicionFinal:
          eorsDisposicionFinal.trim() || 'Pendiente de asignación EO-RS',
        nroManifiestoGuia: nroManifiestoGuia.trim(),
        certificadoDisposicion,
        estadoEvacuacion,
        frenteTrabajo: frenteTrabajo.trim(),
        observaciones: observaciones.trim(),
      },
      initialRecord?.id
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-3xl rounded-xl border border-slate-200 bg-white shadow-xl my-8">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {initialRecord
                ? 'Editar Partida del Registro Interno de Residuos'
                : 'Registrar Generación y Manejo Diario de Residuos Sólidos'}
            </h2>
            <p className="text-xs text-slate-500">
              Formato regulatorio conforme a D.L. N° 1278, D.S. N° 014-2017-MINAM y D.S. N° 002-2022-VIVIENDA
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Quick Catalog Preset Selector */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Catálogo Rápido de Residuos de Construcción y Demolición (Autocompletado Normativo NTP 900.058)
            </label>
            <select
              onChange={(e) => handleApplyTemplate(Number(e.target.value))}
              defaultValue="0"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-emerald-700 focus:outline-hidden"
            >
              {WASTE_CATALOG_TEMPLATES.map((tpl, idx) => (
                <option key={tpl.nombreResiduo} value={idx}>
                  {tpl.nombreResiduo} — [{tpl.tipoResiduo}] · Densidad est: {tpl.densidadKgM3} kg/m³
                </option>
              ))}
            </select>
          </div>

          {/* Row 1: Fecha, Tipo de Residuo, Frente de Trabajo */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Fecha de Registro *
              </label>
              <input
                type="date"
                required
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono text-slate-900 focus:border-emerald-700 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tipo de Residuo (Clasificación Legal) *
              </label>
              <select
                value={tipoResiduo}
                onChange={(e) => setTipoResiduo(e.target.value as WasteCategory)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-700 focus:outline-hidden"
              >
                {WASTE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Frente de Trabajo / Sector de Obra
              </label>
              <input
                type="text"
                value={frenteTrabajo}
                onChange={(e) => setFrenteTrabajo(e.target.value)}
                placeholder="Ej. Sector B - Demolición"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-700 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Row 2: Nombre de residuo */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nombre de residuo (Descripción específica según formato oficial) *
            </label>
            <input
              type="text"
              required
              value={nombreResiduo}
              onChange={(e) => setNombreResiduo(e.target.value)}
              placeholder="Ej. Concreto demolido y bloques de albañilería, madera de encofrado..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-700 focus:outline-hidden"
            />
          </div>

          {/* Row 3: Volumen & Peso with automatic density calculator */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Volumen Generado (m³) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={volumenM3}
                onChange={(e) => handleVolumeChange(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono text-slate-900 focus:border-emerald-700 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Peso Total (kg) *
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                required
                value={pesoKg}
                onChange={(e) => setPesoKg(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono text-slate-900 focus:border-emerald-700 focus:outline-hidden"
              />
            </div>

            <div className="flex flex-col justify-end">
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Calculator className="h-3.5 w-3.5 text-slate-500" />
                  Equivalencia en Toneladas:
                </span>
                <span className="font-mono font-semibold text-slate-900">
                  {((parseFloat(pesoKg) || 0) / 1000).toFixed(3)} t
                </span>
              </div>
            </div>
          </div>

          {/* Row 4: EO-RS Transporta & EO-RS de Disposición Final o Proyecto de Valorización */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                EO-RS Transporta (Razón Social y Registro MINAM) *
              </label>
              <input
                type="text"
                list="transport-eors-list"
                required
                value={eorsTransporta}
                onChange={(e) => setEorsTransporta(e.target.value)}
                placeholder="Seleccione o escriba la EO-RS transportista"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-700 focus:outline-hidden"
              />
              <datalist id="transport-eors-list">
                {transportProviders.map((p) => (
                  <option
                    key={p.id}
                    value={`${p.razonSocial} (${p.registroMinam.slice(0, 16)})`}
                  />
                ))}
                <option value="Pendiente de asignación EO-RS" />
              </datalist>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                EO-RS de Disposición Final o Proyecto de Valorización *
              </label>
              <input
                type="text"
                list="disposal-eors-list"
                required
                value={eorsDisposicionFinal}
                onChange={(e) => setEorsDisposicionFinal(e.target.value)}
                placeholder="Planta de Valorización, Escombrera o Relleno de Seguridad"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-700 focus:outline-hidden"
              />
              <datalist id="disposal-eors-list">
                {disposalProviders.map((p) => (
                  <option key={p.id} value={p.razonSocial} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Row 5: Traceability & Certificates */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                N° Guía / Manifiesto SIGERSOL
              </label>
              <input
                type="text"
                value={nroManifiestoGuia}
                onChange={(e) => setNroManifiestoGuia(e.target.value)}
                placeholder={isHazardous ? 'Ej. MAN-PEL-2026-00912' : 'Ej. GR-004-001895'}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono text-slate-900 focus:border-emerald-700 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Estado de Evacuación
              </label>
              <select
                value={estadoEvacuacion}
                onChange={(e) => {
                  const st = e.target.value as EvacuationStatus;
                  setEstadoEvacuacion(st);
                  setCertificadoDisposicion(st === 'Evacuado con Certificado');
                }}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-700 focus:outline-hidden"
              >
                {EVACUATION_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2.5 text-xs font-medium text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={certificadoDisposicion}
                  onChange={(e) => setCertificadoDisposicion(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-600"
                />
                <span>Cuenta con Certificado / Boleta EO-RS</span>
              </label>
            </div>
          </div>

          {/* Live Regulatory Warning if Hazardous Waste lacks Manifest */}
          {missingHazardousManifest && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 flex items-start gap-2.5 text-xs text-amber-900">
              <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Advertencia Legal Preventiva (Art. 58° D.S. 014-2017-MINAM):</span>{' '}
                Está registrando un Residuo Peligroso sin consignar el N° de Manifiesto de Manejo de Residuos Sólidos Peligrosos. Si se guarda vacío, el sistema activará una alerta crítica de fiscalización hasta regularizar el manifiesto.
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-800 whitespace-nowrap shrink-0"
            >
              <Check className="h-4 w-4" />
              {initialRecord ? 'Guardar Cambios en Registro' : 'Agregar al Registro Interno'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
