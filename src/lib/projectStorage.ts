import { BodyMeasurements, FabricProperties, GarmentType, MeasurementUnit } from '@/data/fabricData';

const STORAGE_KEY = 'dsgwear.projects.v1';
const MAX_PROJECTS = 15;

export interface SavedProjectSnapshot {
  id: string;
  name: string;
  step: number;
  garmentType: GarmentType;
  measurements: BodyMeasurements;
  fabric: FabricProperties;
  unit: MeasurementUnit;
  savedAt: string;
}

function safeRead(): SavedProjectSnapshot[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function safeWrite(projects: SavedProjectSnapshot[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects.slice(0, MAX_PROJECTS)));
}

export function saveProjectSnapshot(
  project: Omit<SavedProjectSnapshot, 'id' | 'savedAt'>
): SavedProjectSnapshot {
  const snapshot: SavedProjectSnapshot = {
    ...project,
    id: crypto.randomUUID(),
    savedAt: new Date().toISOString(),
  };
  const projects = safeRead();
  safeWrite([snapshot, ...projects]);
  return snapshot;
}

export function getSavedProjects(): SavedProjectSnapshot[] {
  return safeRead();
}

export function getLatestProject(): SavedProjectSnapshot | null {
  const projects = safeRead();
  return projects.length > 0 ? projects[0] : null;
}
