import React, { createContext, useContext, useState, ReactNode } from 'react';
import {
  BodyMeasurements,
  FabricProperties,
  GarmentType,
  MeasurementUnit,
  DEFAULT_MEASUREMENTS,
  FABRIC_PRESETS,
  getMeasurementsForGarment,
  isMeasurementValid,
} from '@/data/fabricData';
import { SavedProjectSnapshot } from '@/lib/projectStorage';

export interface WorkflowState {
  step: number;
  garmentType: GarmentType | null;
  measurements: BodyMeasurements;
  fabric: FabricProperties;
  unit: MeasurementUnit;
  projectName: string;
}

interface WorkflowContextType {
  state: WorkflowState;
  setStep: (step: number) => void;
  setGarmentType: (type: GarmentType) => void;
  setMeasurements: (m: BodyMeasurements) => void;
  setFabric: (f: FabricProperties) => void;
  setUnit: (u: MeasurementUnit) => void;
  setProjectName: (name: string) => void;
  loadProject: (project: SavedProjectSnapshot) => void;
  canProceed: () => boolean;
  reset: () => void;
}

const initialState: WorkflowState = {
  step: 0,
  garmentType: null,
  measurements: DEFAULT_MEASUREMENTS,
  fabric: FABRIC_PRESETS[0],
  unit: 'cm',
  projectName: '',
};

const WorkflowContext = createContext<WorkflowContextType | null>(null);

export function WorkflowProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WorkflowState>(initialState);

  const setStep = (step: number) => setState(s => ({ ...s, step }));
  const setGarmentType = (garmentType: GarmentType) => setState(s => ({ ...s, garmentType }));
  const setMeasurements = (measurements: BodyMeasurements) => setState(s => ({ ...s, measurements }));
  const setFabric = (fabric: FabricProperties) => setState(s => ({ ...s, fabric }));
  const setUnit = (unit: MeasurementUnit) => setState(s => ({ ...s, unit }));
  const setProjectName = (projectName: string) => setState(s => ({ ...s, projectName }));
  const loadProject = (project: SavedProjectSnapshot) =>
    setState({
      step: project.step,
      garmentType: project.garmentType,
      measurements: project.measurements,
      fabric: project.fabric,
      unit: project.unit,
      projectName: project.name,
    });

  const canProceed = () => {
    switch (state.step) {
      case 0:
        return state.garmentType !== null;
      case 1:
        if (!state.garmentType) return false;
        return getMeasurementsForGarment(state.garmentType).every(key => isMeasurementValid(key, state.measurements[key]));
      case 2:
      case 3:
        return true;
      default:
        return false;
    }
  };

  const reset = () => setState(initialState);

  return (
    <WorkflowContext.Provider
      value={{
        state,
        setStep,
        setGarmentType,
        setMeasurements,
        setFabric,
        setUnit,
        setProjectName,
        loadProject,
        canProceed,
        reset,
      }}
    >
      {children}
    </WorkflowContext.Provider>
  );
}

export function useWorkflow() {
  const ctx = useContext(WorkflowContext);
  if (!ctx) throw new Error('useWorkflow must be within WorkflowProvider');
  return ctx;
}
