import { motion } from 'framer-motion';
import { useWorkflow } from '@/contexts/WorkflowContext';
import { FABRIC_PRESETS, FabricProperties } from '@/data/fabricData';
import { Slider } from '@/components/ui/slider';
import { useState } from 'react';

export default function FabricStep() {
  const { state, setFabric } = useWorkflow();
  const [customMode, setCustomMode] = useState(false);

  const handlePresetSelect = (fabric: FabricProperties) => {
    setFabric(fabric);
    setCustomMode(false);
  };

  const handleCustomChange = (key: keyof FabricProperties, value: number) => {
    setFabric({ ...state.fabric, [key]: value, id: 'custom', name: 'Custom Fabric' });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Fabric Properties</h2>
        <p className="text-sm text-muted-foreground mt-1">Select a fabric preset or customize properties</p>
      </div>

      {/* Preset grid */}
      <div className="grid grid-cols-2 gap-3 max-h-[240px] overflow-y-auto pr-1">
        {FABRIC_PRESETS.map((fabric, i) => {
          const selected = state.fabric.id === fabric.id && !customMode;
          return (
            <motion.button
              key={fabric.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => handlePresetSelect(fabric)}
              className={`p-3 rounded-lg border text-left transition-all ${
                selected
                  ? 'border-primary glow-cyan bg-secondary'
                  : 'border-border hover:border-primary/30 bg-card'
              }`}
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-foreground">{fabric.name}</h4>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                  {fabric.category}
                </span>
              </div>
              <div className="mt-2 flex gap-3 text-[10px] text-muted-foreground font-mono">
                <span>Stretch: {fabric.elasticity}%</span>
                <span>Drape: {(fabric.drapeCoefficient * 100).toFixed(0)}%</span>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Custom toggle */}
      <button
        onClick={() => setCustomMode(!customMode)}
        className="text-xs text-primary hover:text-primary/80 transition-colors font-medium"
      >
        {customMode ? '← Back to presets' : '⚙ Customize properties manually'}
      </button>

      {/* Custom sliders */}
      {customMode && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="space-y-4 bg-card p-4 rounded-lg border border-border"
        >
          {[
            { key: 'elasticity' as const, label: 'Elasticity', min: 0, max: 100, unit: '%' },
            { key: 'drapeCoefficient' as const, label: 'Drape Coefficient', min: 0, max: 1, unit: '', step: 0.01 },
            { key: 'tensileStrength' as const, label: 'Tensile Strength', min: 0, max: 100, unit: '' },
            { key: 'thickness' as const, label: 'Thickness', min: 0.05, max: 2, unit: 'mm', step: 0.05 },
          ].map(prop => (
            <div key={prop.key} className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{prop.label}</span>
                <span className="font-mono text-foreground">
                  {(state.fabric[prop.key] as number).toFixed(prop.step && prop.step < 1 ? 2 : 0)}{prop.unit}
                </span>
              </div>
              <Slider
                value={[state.fabric[prop.key] as number]}
                min={prop.min}
                max={prop.max}
                step={prop.step || 1}
                onValueChange={([v]) => handleCustomChange(prop.key, v)}
                className="cursor-pointer"
              />
            </div>
          ))}
        </motion.div>
      )}

      {/* Selected fabric summary */}
      <div className="bg-secondary/50 rounded-lg p-4 border border-border space-y-2">
        <h4 className="text-xs font-semibold text-primary font-mono">SELECTED FABRIC</h4>
        <p className="text-sm font-medium text-foreground">{state.fabric.name}</p>
        <div className="grid grid-cols-3 gap-2 text-[11px] font-mono text-muted-foreground">
          <div>Elasticity: <span className="text-foreground">{state.fabric.elasticity}%</span></div>
          <div>Drape: <span className="text-foreground">{(state.fabric.drapeCoefficient * 100).toFixed(0)}%</span></div>
          <div>Strength: <span className="text-foreground">{state.fabric.tensileStrength}</span></div>
          <div>H-Stretch: <span className="text-foreground">{state.fabric.stretchH}x</span></div>
          <div>V-Stretch: <span className="text-foreground">{state.fabric.stretchV}x</span></div>
          <div>Thickness: <span className="text-foreground">{state.fabric.thickness}mm</span></div>
        </div>
      </div>
    </div>
  );
}
