import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useWorkflow } from '@/contexts/WorkflowContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { generatePattern, patternToSVG, patternToDXF } from '@/lib/patternEngine';
import { GARMENT_IMAGES } from '@/assets/garments';
import jsPDF from 'jspdf';
import { Download, FileText, Settings, Image, Loader2, Eye, EyeOff } from 'lucide-react';

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function ExportStep() {
  const { state } = useWorkflow();
  const [exporting, setExporting] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(true);

  const pattern = useMemo(() => {
    if (!state.garmentType) return null;
    return generatePattern(state.measurements, state.fabric, state.garmentType);
  }, [state.measurements, state.fabric, state.garmentType]);

  const svgString = useMemo(() => {
    if (!pattern || !state.garmentType) return null;
    return patternToSVG(pattern, state.garmentType, state.fabric.name);
  }, [pattern, state.garmentType, state.fabric.name]);

  const handleExportSVG = () => {
    if (!svgString) return;
    setExporting('SVG');
    try {
      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      downloadBlob(blob, `dsgwear-${state.garmentType}-pattern.svg`);
      toast.success('SVG exported successfully');
    } catch (e) {
      toast.error('Export failed');
    }
    setExporting(null);
  };

  const handleExportDXF = () => {
    if (!pattern) return;
    setExporting('DXF');
    try {
      const dxfStr = patternToDXF(pattern);
      const blob = new Blob([dxfStr], { type: 'application/dxf' });
      downloadBlob(blob, `dsgwear-${state.garmentType}-pattern.dxf`);
      toast.success('DXF exported successfully');
    } catch (e) {
      toast.error('Export failed');
    }
    setExporting(null);
  };

  const handleExportPDF = async () => {
    if (!svgString || !state.garmentType) return;
    setExporting('PDF');
    try {
      const img = new window.Image();
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            const scale = 2;
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;
            const ctx = canvas.getContext('2d')!;
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.scale(scale, scale);
            ctx.drawImage(img, 0, 0);

            const pdf = new jsPDF({
              orientation: img.width > img.height ? 'landscape' : 'portrait',
              unit: 'mm',
              format: 'a3',
            });

            const pdfW = pdf.internal.pageSize.getWidth();
            const pdfH = pdf.internal.pageSize.getHeight();
            const margin = 10;
            const availW = pdfW - margin * 2;
            const availH = pdfH - margin * 2;
            const ratio = Math.min(availW / img.width, availH / img.height);

            const imgData = canvas.toDataURL('image/png');
            pdf.addImage(imgData, 'PNG', margin, margin, img.width * ratio, img.height * ratio);

            pdf.setFontSize(8);
            pdf.setTextColor(128);
            pdf.text(
              `DSG WEAR | ${state.garmentType!.toUpperCase()} | ${state.fabric.name} | SA: ${pattern!.seamAllowance}cm | Scale: check ruler`,
              margin,
              pdfH - 5
            );

            const rulerY = pdfH - 15;
            const rulerLen = 10 * ratio * 3;
            pdf.setDrawColor(0);
            pdf.setLineWidth(0.3);
            pdf.line(margin, rulerY, margin + rulerLen, rulerY);
            pdf.line(margin, rulerY - 2, margin, rulerY + 2);
            pdf.line(margin + rulerLen, rulerY - 2, margin + rulerLen, rulerY + 2);
            pdf.setFontSize(7);
            pdf.setTextColor(0);
            pdf.text('10 cm', margin + rulerLen / 2, rulerY - 3, { align: 'center' });

            pdf.save(`dsgwear-${state.garmentType}-pattern.pdf`);
            toast.success('PDF exported with scale ruler');
            resolve();
          } catch (e) {
            reject(e);
          }
        };
        img.onerror = reject;
        img.src = url;
      });

      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      toast.error('PDF export failed');
    }
    setExporting(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Export Pattern</h2>
        <p className="text-sm text-muted-foreground mt-1">Review your design and download production-ready pattern files</p>
      </div>

      {/* Garment reference photo + summary side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {state.garmentType && (
          <div className="bg-card rounded-lg border border-border p-4 flex items-center justify-center">
            <img
              src={GARMENT_IMAGES[state.garmentType]}
              alt={`${state.garmentType} reference`}
              className="max-h-[200px] object-contain rounded"
            />
          </div>
        )}
        <div className="bg-card rounded-lg border border-border p-4 space-y-3">
          <h4 className="text-xs font-mono font-semibold text-primary">PROJECT SUMMARY</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground text-xs">Garment</span>
              <p className="font-medium text-foreground capitalize">{state.garmentType}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Fabric</span>
              <p className="font-medium text-foreground">{state.fabric.name}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Bust / Waist / Hip</span>
              <p className="font-mono text-foreground text-xs">
                {state.measurements.bust} / {state.measurements.waist} / {state.measurements.hip} cm
              </p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Pieces / Seam</span>
              <p className="font-mono text-foreground text-xs">{pattern?.pieces.length ?? 0} pieces / {pattern?.seamAllowance ?? 1.5}cm SA</p>
            </div>
          </div>
          {pattern && pattern.fabricAdjustments.length > 0 && (
            <div className="mt-2 pt-2 border-t border-border">
              <p className="text-[10px] font-mono text-muted-foreground mb-1">ADJUSTMENTS:</p>
              {pattern.fabricAdjustments.map((a, i) => (
                <p key={i} className="text-[11px] text-muted-foreground">▸ {a}</p>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Inline Pattern Preview */}
      {svgString && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-mono font-semibold text-primary">PATTERN PREVIEW</h4>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 text-xs text-muted-foreground"
              onClick={() => setShowPreview(p => !p)}
            >
              {showPreview ? <EyeOff size={13} /> : <Eye size={13} />}
              {showPreview ? 'Hide' : 'Show'}
            </Button>
          </div>
          {showPreview && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-card rounded-lg border border-border overflow-auto"
              style={{ maxHeight: 420 }}
            >
              <div
                className="w-full p-2"
                dangerouslySetInnerHTML={{ __html: svgString }}
                style={{ background: 'white' }}
              />
            </motion.div>
          )}
        </div>
      )}

      {/* Export options */}
      <div className="grid grid-cols-1 gap-3">
        {[
          {
            format: 'PDF',
            desc: 'A3 printable sheet with scale ruler, annotations & cutting guides',
            icon: FileText,
            handler: handleExportPDF,
          },
          {
            format: 'DXF',
            desc: 'AutoCAD-compatible format for CNC plotters & cutting machines',
            icon: Settings,
            handler: handleExportDXF,
          },
          {
            format: 'SVG',
            desc: 'Scalable vector with all pattern details for digital workflows',
            icon: Image,
            handler: handleExportSVG,
          },
        ].map((opt, i) => (
          <motion.div
            key={opt.format}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Button
              variant="outline"
              className="w-full justify-start h-auto py-4 px-5 border-border hover:border-primary/50 hover:bg-secondary/50"
              onClick={opt.handler}
              disabled={exporting !== null}
            >
              {exporting === opt.format ? (
                <Loader2 size={20} className="mr-4 animate-spin text-primary" />
              ) : (
                <opt.icon size={20} className="mr-4 text-primary" />
              )}
              <div className="text-left flex-1">
                <p className="font-semibold text-foreground">Export as {opt.format}</p>
                <p className="text-xs text-muted-foreground">{opt.desc}</p>
              </div>
              <Download size={16} className="text-muted-foreground" />
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
