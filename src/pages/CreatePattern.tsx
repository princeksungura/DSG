import { motion, AnimatePresence } from 'framer-motion';
import { useWorkflow, WorkflowProvider } from '@/contexts/WorkflowContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import GarmentTypeStep from '@/components/workflow/GarmentTypeStep';
import MeasurementsStep from '@/components/workflow/MeasurementsStep';
import FabricStep from '@/components/workflow/FabricStep';
import PatternPreviewStep from '@/components/workflow/PatternPreviewStep';
import ExportStep from '@/components/workflow/ExportStep';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Home, Save, FolderOpen } from 'lucide-react';
import { saveProjectSnapshot, getLatestProject } from '@/lib/projectStorage';
import { toast } from 'sonner';

const STEPS = [
  { label: 'Garment', shortLabel: 'Type' },
  { label: 'Measurements', shortLabel: 'Body' },
  { label: 'Fabric', shortLabel: 'Fabric' },
  { label: 'Generate', shortLabel: 'Pattern' },
  { label: 'Export', shortLabel: 'Export' },
];

function WorkflowContent() {
  const { state, setStep, setProjectName, loadProject, canProceed } = useWorkflow();
  const navigate = useNavigate();

  const StepComponent = [GarmentTypeStep, MeasurementsStep, FabricStep, PatternPreviewStep, ExportStep][state.step];
  const canSave = state.garmentType !== null;

  const handleSave = () => {
    if (!state.garmentType) {
      toast.error('Select a garment first before saving.');
      return;
    }

    const fallbackName = `${state.garmentType}-${new Date().toISOString().slice(0, 10)}`;
    const name = state.projectName.trim() || fallbackName;

    saveProjectSnapshot({
      name,
      step: state.step,
      garmentType: state.garmentType,
      measurements: state.measurements,
      fabric: state.fabric,
      unit: state.unit,
    });

    setProjectName(name);
    toast.success(`Saved project "${name}"`);
  };

  const handleLoadLatest = () => {
    const latest = getLatestProject();
    if (!latest) {
      toast.error('No saved projects found.');
      return;
    }
    loadProject(latest);
    toast.success(`Loaded "${latest.name}"`);
  };

  return (
    <div className="min-h-screen bg-background blueprint-grid">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between gap-3">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <Home size={16} />
            <span className="font-mono text-xs">DSG WEAR</span>
          </button>

          {/* Step indicators */}
          <div className="flex items-center gap-1">
            {STEPS.map((step, i) => (
              <button
                key={i}
                onClick={() => i <= state.step && setStep(i)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono transition-all ${
                  i === state.step
                    ? 'bg-primary text-primary-foreground'
                    : i < state.step
                    ? 'text-primary hover:bg-secondary cursor-pointer'
                    : 'text-muted-foreground cursor-default'
                }`}
              >
                <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center border ${
                  i <= state.step ? 'border-primary' : 'border-muted-foreground/30'
                }`}>
                  {i < state.step ? '✓' : i + 1}
                </span>
                <span className="hidden md:inline">{step.shortLabel}</span>
              </button>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-2">
            <Input
              value={state.projectName}
              onChange={e => setProjectName(e.target.value)}
              placeholder="Project name"
              className="h-8 w-44 text-xs font-mono"
            />
            <Button variant="outline" size="sm" className="h-8 gap-1 text-xs" onClick={handleLoadLatest}>
              <FolderOpen size={13} /> Load
            </Button>
            <Button size="sm" className="h-8 gap-1 text-xs" onClick={handleSave} disabled={!canSave}>
              <Save size={13} /> Save
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-2xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={state.step}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <StepComponent />
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-between mt-8 pt-6 border-t border-border">
          <Button
            variant="outline"
            onClick={() => setStep(state.step - 1)}
            disabled={state.step === 0}
            className="gap-2"
          >
            <ArrowLeft size={14} /> Back
          </Button>

          {state.step < STEPS.length - 1 && (
            <Button
              onClick={() => setStep(state.step + 1)}
              disabled={!canProceed()}
              className="gap-2"
            >
              Next <ArrowRight size={14} />
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}

export default function CreatePattern() {
  return (
    <WorkflowProvider>
      <WorkflowContent />
    </WorkflowProvider>
  );
}
