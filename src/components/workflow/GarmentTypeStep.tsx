import { motion } from 'framer-motion';
import { useWorkflow } from '@/contexts/WorkflowContext';
import { GARMENT_TYPES } from '@/data/fabricData';

export default function GarmentTypeStep() {
  const { state, setGarmentType } = useWorkflow();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Select Garment Type</h2>
        <p className="text-sm text-muted-foreground mt-1">Choose a garment. Required measurements and generated cloth pieces will adapt automatically.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {GARMENT_TYPES.map((garment, i) => {
          const selected = state.garmentType === garment.value;
          return (
            <motion.button
              key={garment.value}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => setGarmentType(garment.value)}
              className={`relative p-5 rounded-lg border-2 text-left transition-all ${
                selected ? 'border-primary glow-cyan bg-secondary' : 'border-border hover:border-primary/30 bg-card'
              }`}
            >
              <span className="text-xs font-mono mb-3 inline-flex h-7 w-7 items-center justify-center rounded bg-muted text-foreground">
                {garment.icon}
              </span>
              <h3 className="font-semibold text-foreground text-sm">{garment.label}</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{garment.description}</p>
              {selected && (
                <motion.div
                  layoutId="garment-check"
                  className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs"
                >
                  OK
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
