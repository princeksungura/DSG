import { motion } from 'framer-motion';
import { useWorkflow } from '@/contexts/WorkflowContext';
import { MEASUREMENT_LABELS, BodyMeasurements } from '@/data/fabricData';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function MeasurementsStep() {
  const { state, setMeasurements, setUnit } = useWorkflow();
  const { measurements, unit } = state;

  const convert = (cm: number) => unit === 'inches' ? Math.round(cm / 2.54 * 10) / 10 : cm;
  const toInternal = (val: number) => unit === 'inches' ? Math.round(val * 2.54 * 10) / 10 : val;

  const handleChange = (key: keyof BodyMeasurements, value: string) => {
    const num = parseFloat(value) || 0;
    setMeasurements({ ...measurements, [key]: toInternal(num) });
  };

  const getValidation = (key: keyof BodyMeasurements) => {
    const meta = MEASUREMENT_LABELS[key];
    const val = measurements[key];
    if (val < meta.minCm || val > meta.maxCm) return 'invalid';
    return 'valid';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Body Measurements</h2>
          <p className="text-sm text-muted-foreground mt-1">Enter accurate body measurements</p>
        </div>
        <div className="flex gap-1 bg-secondary rounded-md p-1">
          {(['cm', 'inches'] as const).map(u => (
            <button
              key={u}
              onClick={() => setUnit(u)}
              className={`px-3 py-1 text-xs font-mono rounded transition-colors ${
                unit === u ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {u}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {(Object.keys(MEASUREMENT_LABELS) as (keyof BodyMeasurements)[]).map((key, i) => {
          const meta = MEASUREMENT_LABELS[key];
          const validation = getValidation(key);
          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="space-y-1.5"
            >
              <Label className="text-xs text-muted-foreground">{meta.label}</Label>
              <div className="relative">
                <Input
                  type="number"
                  value={convert(measurements[key]) || ''}
                  onChange={e => handleChange(key, e.target.value)}
                  className={`font-mono text-sm pr-10 bg-secondary border ${
                    validation === 'invalid' ? 'border-destructive' : 'border-border focus:border-primary'
                  }`}
                  placeholder={meta.description}
                  step={unit === 'inches' ? 0.1 : 0.5}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono">
                  {unit}
                </span>
              </div>
              {validation === 'invalid' && (
                <p className="text-[10px] text-destructive">
                  Range: {convert(meta.minCm)}–{convert(meta.maxCm)} {unit}
                </p>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
