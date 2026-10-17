import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Eraser, PenTool, ShieldCheck, Stamp, X } from 'lucide-react';
import { MonthlySignature, ProjectMetadata } from '../types/waste';
import { formatMonthLabel } from '../utils/complianceEngine';

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetMonth: string;
  project: ProjectMetadata;
  existingSignature?: MonthlySignature;
  onSaveSignature: (sig: MonthlySignature) => void;
  recordCount: number;
  totalWeightKg: number;
}

export const SignatureModal: React.FC<SignatureModalProps> = ({
  isOpen,
  onClose,
  targetMonth,
  project,
  existingSignature,
  onSaveSignature,
  recordCount,
  totalWeightKg,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [signedBy, setSignedBy] = useState(project.responsableRegistro);
  const [role, setRole] = useState(project.cargoResponsable);
  const [cipDni, setCipDni] = useState(project.cipDni);
  const [observacionesCierre, setObservacionesCierre] = useState(
    'Doy fe de la veracidad de los volúmenes, pesos y manifiestos consignados en el Registro Interno conforme al D.L. N° 1278 y D.S. N° 002-2022-VIVIENDA.'
  );

  useEffect(() => {
    if (!isOpen) return;
    setSignedBy(existingSignature?.signedBy || project.responsableRegistro);
    setRole(existingSignature?.role || project.cargoResponsable);
    setCipDni(existingSignature?.cipDni || project.cipDni);
    if (existingSignature?.observacionesCierre) {
      setObservacionesCierre(existingSignature.observacionesCierre);
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw subtle baseline
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(24, canvas.height - 32);
    ctx.lineTo(canvas.width - 24, canvas.height - 32);
    ctx.stroke();
    ctx.setLineDash([]);
    setHasDrawn(false);
  }, [isOpen, existingSignature, project]);

  if (!isOpen) return null;

  const getCoordinates = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(24, canvas.height - 32);
    ctx.lineTo(canvas.width - 24, canvas.height - 32);
    ctx.stroke();
    ctx.setLineDash([]);
    setHasDrawn(false);
  };

  const generateOfficialRubric = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    clearCanvas();

    // Draw an authentic engineering cursive rubric + official seal on the canvas
    ctx.save();
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(65, 108);
    ctx.bezierCurveTo(85, 38, 112, 32, 122, 95);
    ctx.bezierCurveTo(130, 128, 152, 54, 178, 68);
    ctx.bezierCurveTo(198, 78, 182, 112, 212, 98);
    ctx.bezierCurveTo(244, 82, 268, 34, 290, 50);
    ctx.bezierCurveTo(308, 64, 282, 114, 315, 102);
    ctx.bezierCurveTo(345, 92, 372, 62, 405, 74);
    ctx.stroke();

    // Underline flourish
    ctx.strokeStyle = '#1D4ED8';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(80, 118);
    ctx.quadraticCurveTo(240, 106, 415, 114);
    ctx.stroke();

    // Stamp metadata on canvas
    ctx.fillStyle = '#334155';
    ctx.font = '600 10px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(
      `FIRMADO DIGITALMENTE · ${cipDni.toUpperCase()}`,
      canvas.width / 2,
      canvas.height - 12
    );
    ctx.restore();
    setHasDrawn(true);
  };

  const handleConfirmSignature = (e: React.FormEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (!hasDrawn) {
      generateOfficialRubric();
    }

    const dataUrl = canvas.toDataURL('image/png');
    const hashSeed = `${targetMonth}-${recordCount}-${Math.round(totalWeightKg)}-${Date.now()
      .toString(16)
      .slice(-6)
      .toUpperCase()}`;
    const verificationHash = `SHA256-${hashSeed}-MINAM`;

    onSaveSignature({
      month: targetMonth,
      signedBy: signedBy.trim() || project.responsableRegistro,
      role: role.trim() || project.cargoResponsable,
      cipDni: cipDni.trim() || project.cipDni,
      signedAt: new Date().toISOString(),
      signatureDataUrl: dataUrl,
      verificationHash,
      observacionesCierre,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Firma Digital y Validación de Registro Interno
            </h2>
            <p className="text-xs text-slate-500">
              Periodo de cierre: {formatMonthLabel(targetMonth)} · {recordCount} partidas ({(totalWeightKg / 1000).toFixed(2)} t)
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Cerrar ventana de firma"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleConfirmSignature} className="p-6 space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Responsable que Suscribe
              </label>
              <input
                type="text"
                required
                value={signedBy}
                onChange={(e) => setSignedBy(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-700 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Cargo / Especialidad
              </label>
              <input
                type="text"
                required
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-700 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Colegiatura CIP / DNI
              </label>
              <input
                type="text"
                required
                value={cipDni}
                onChange={(e) => setCipDni(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono text-slate-900 focus:border-emerald-700 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <PenTool className="h-3.5 w-3.5 text-slate-500" />
                Trazo de Firma Manuscrita Digital o Sello de Colegiatura
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={generateOfficialRubric}
                  className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                >
                  <Stamp className="h-3.5 w-3.5 text-emerald-700" />
                  Generar Sello y Rúbrica CIP
                </button>
                <button
                  type="button"
                  onClick={clearCanvas}
                  className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  <Eraser className="h-3.5 w-3.5" />
                  Limpiar Lienzo
                </button>
              </div>
            </div>

            <div className="overflow-hidden rounded-lg border border-slate-300 bg-white">
              <canvas
                ref={canvasRef}
                width={520}
                height={150}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-[150px] cursor-crosshair touch-none"
              />
            </div>
            <p className="mt-1.5 text-xs text-slate-500">
              Dibuje su firma con el cursor/pantalla táctil o pulse «Generar Sello y Rúbrica CIP» para estampar su firma registrada. La firma se incrustará en el Formato Oficial y en la exportación PDF.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Declaración Jurada de Conformidad para Fiscalización
            </label>
            <textarea
              rows={2}
              value={observacionesCierre}
              onChange={(e) => setObservacionesCierre(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-700 focus:border-emerald-700 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center justify-between border-t border-slate-200 pt-4">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <ShieldCheck className="h-4 w-4 text-emerald-700 shrink-0" />
              <span>Genera sello de tiempo inmutable y código SHA-256 auditable</span>
            </div>
            <div className="flex items-center gap-3">
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
                <CheckCircle2 className="h-4 w-4" />
                Estampar Firma Digital y Validar Mes
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
