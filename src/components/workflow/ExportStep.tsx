import { motion } from 'framer-motion';
import { useWorkflow } from '@/contexts/WorkflowContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function ExportStep() {
  const { state } = useWorkflow();

  const handleExport = (format: string) => {
    toast.success(`${format} export initiated`, {
      description: `Your ${state.garmentType} pattern is being prepared for ${format} download.`,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Export Pattern</h2>
        <p className="text-sm text-muted-foreground mt-1">Download your production-ready pattern files</p>
      </div>

      {/* Summary */}
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
            <span className="text-muted-foreground text-xs">Elasticity</span>
            <p className="font-mono text-foreground text-xs">{state.fabric.elasticity}%</p>
          </div>
        </div>
      </div>

      {/* Export options */}
      <div className="grid grid-cols-1 gap-3">
        {[
          { format: 'PDF', desc: 'Printable pattern sheets with annotations', icon: '📄' },
          { format: 'DXF', desc: 'For CNC cutting machines (CAD standard)', icon: '⚙️' },
          { format: 'SVG', desc: 'Scalable vector for digital use', icon: '🖼️' },
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
              onClick={() => handleExport(opt.format)}
            >
              <span className="text-xl mr-4">{opt.icon}</span>
              <div className="text-left">
                <p className="font-semibold text-foreground">Export as {opt.format}</p>
                <p className="text-xs text-muted-foreground">{opt.desc}</p>
              </div>
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
