// Fabric presets and types for DSG Wear

export interface FabricProperties {
  id: string;
  name: string;
  category: 'woven' | 'knit';
  elasticity: number; // percentage 0-100
  stretchH: number; // horizontal stretch ratio
  stretchV: number; // vertical stretch ratio
  tensileStrength: number; // 0-100 scale
  drapeCoefficient: number; // 0-1
  thickness: number; // mm
}

export type MeasurementKey =
  | 'bust'
  | 'chest'
  | 'waist'
  | 'hip'
  | 'shoulderWidth'
  | 'sleeveLength'
  | 'garmentLength'
  | 'armholeDepth'
  | 'neck'
  | 'wrist'
  | 'cuffOpening'
  | 'inseam'
  | 'outseam'
  | 'thigh'
  | 'knee'
  | 'ankle'
  | 'waistToHip'
  | 'skirtLength'
  | 'hoodDepth'
  | 'hoodHeight'
  | 'backLength';

export type BodyMeasurements = Record<MeasurementKey, number>;

export type GarmentType =
  | 'tshirt'
  | 'dress-shirt'
  | 'polo'
  | 'dress'
  | 'trousers'
  | 'skirt'
  | 'jacket'
  | 'coat'
  | 'shorts'
  | 'hoodie'
  | 'sweatshirt'
  | 'vest';

export type MeasurementUnit = 'cm' | 'inches';

export interface PatternProject {
  id: string;
  name: string;
  garmentType: GarmentType;
  measurements: BodyMeasurements;
  fabric: FabricProperties;
  unit: MeasurementUnit;
  createdAt: Date;
}

export const FABRIC_PRESETS: FabricProperties[] = [
  {
    id: 'cotton-poplin',
    name: 'Cotton Poplin',
    category: 'woven',
    elasticity: 2,
    stretchH: 1.02,
    stretchV: 1.01,
    tensileStrength: 75,
    drapeCoefficient: 0.35,
    thickness: 0.3,
  },
  {
    id: 'silk-charmeuse',
    name: 'Silk Charmeuse',
    category: 'woven',
    elasticity: 5,
    stretchH: 1.03,
    stretchV: 1.02,
    tensileStrength: 45,
    drapeCoefficient: 0.82,
    thickness: 0.15,
  },
  {
    id: 'jersey-knit',
    name: 'Jersey Knit',
    category: 'knit',
    elasticity: 40,
    stretchH: 1.4,
    stretchV: 1.15,
    tensileStrength: 55,
    drapeCoefficient: 0.65,
    thickness: 0.5,
  },
  {
    id: 'denim',
    name: 'Denim (12oz)',
    category: 'woven',
    elasticity: 3,
    stretchH: 1.02,
    stretchV: 1.01,
    tensileStrength: 90,
    drapeCoefficient: 0.2,
    thickness: 0.8,
  },
  {
    id: 'chiffon',
    name: 'Chiffon',
    category: 'woven',
    elasticity: 3,
    stretchH: 1.02,
    stretchV: 1.02,
    tensileStrength: 25,
    drapeCoefficient: 0.9,
    thickness: 0.1,
  },
  {
    id: 'stretch-cotton',
    name: 'Stretch Cotton (Spandex blend)',
    category: 'woven',
    elasticity: 15,
    stretchH: 1.15,
    stretchV: 1.05,
    tensileStrength: 70,
    drapeCoefficient: 0.4,
    thickness: 0.35,
  },
  {
    id: 'linen',
    name: 'Linen',
    category: 'woven',
    elasticity: 1,
    stretchH: 1.01,
    stretchV: 1,
    tensileStrength: 80,
    drapeCoefficient: 0.45,
    thickness: 0.4,
  },
  {
    id: 'ponte-roma',
    name: 'Ponte Roma',
    category: 'knit',
    elasticity: 25,
    stretchH: 1.25,
    stretchV: 1.1,
    tensileStrength: 65,
    drapeCoefficient: 0.5,
    thickness: 0.7,
  },
];

export const GARMENT_TYPES: { value: GarmentType; label: string; description: string; icon: string }[] = [
  { value: 'tshirt', label: 'T-Shirt', description: 'Front/back bodice and sleeves', icon: 'TS' },
  { value: 'dress-shirt', label: 'Dress Shirt', description: 'Collar stand, cuffs, and placket', icon: 'DS' },
  { value: 'polo', label: 'Polo', description: 'Short placket with collar', icon: 'PO' },
  { value: 'dress', label: 'Dress', description: 'Bodice plus skirt panels', icon: 'DR' },
  { value: 'trousers', label: 'Trousers', description: 'Leg panels, fly, waistband, pockets', icon: 'TR' },
  { value: 'skirt', label: 'Skirt', description: 'Front/back panels with waistband', icon: 'SK' },
  { value: 'jacket', label: 'Jacket', description: 'Structured shell with facings', icon: 'JA' },
  { value: 'coat', label: 'Coat', description: 'Long jacket with more structure', icon: 'CO' },
  { value: 'shorts', label: 'Shorts', description: 'Leg panels with waistband', icon: 'SH' },
  { value: 'hoodie', label: 'Hoodie', description: 'Bodice, sleeves, hood, and ribs', icon: 'HO' },
  { value: 'sweatshirt', label: 'Sweatshirt', description: 'Bodice, sleeves, cuffs, hem rib', icon: 'SW' },
  { value: 'vest', label: 'Vest', description: 'Front split, back panel, facings', icon: 'VE' },
];

export const MEASUREMENT_LABELS: Record<MeasurementKey, { label: string; description: string; minCm: number; maxCm: number }> = {
  bust: { label: 'Bust', description: 'Circumference at fullest point', minCm: 60, maxCm: 150 },
  chest: { label: 'Chest', description: 'Chest circumference for menswear blocks', minCm: 70, maxCm: 170 },
  waist: { label: 'Waist', description: 'Natural waist circumference', minCm: 50, maxCm: 140 },
  hip: { label: 'Hip', description: 'Circumference at widest point', minCm: 65, maxCm: 160 },
  shoulderWidth: { label: 'Shoulder Width', description: 'Point to point across back', minCm: 30, maxCm: 60 },
  sleeveLength: { label: 'Sleeve Length', description: 'Shoulder point to wrist', minCm: 20, maxCm: 80 },
  garmentLength: { label: 'Garment Length', description: 'Nape to desired hem', minCm: 40, maxCm: 170 },
  armholeDepth: { label: 'Armhole Depth', description: 'Shoulder to underarm level', minCm: 15, maxCm: 35 },
  neck: { label: 'Neck', description: 'Neck circumference at collar line', minCm: 28, maxCm: 55 },
  wrist: { label: 'Wrist', description: 'Wrist circumference', minCm: 12, maxCm: 30 },
  cuffOpening: { label: 'Cuff Opening', description: 'Finished cuff opening', minCm: 16, maxCm: 40 },
  inseam: { label: 'Inseam', description: 'Crotch to hem length', minCm: 35, maxCm: 100 },
  outseam: { label: 'Outseam', description: 'Waist to hem outer length', minCm: 40, maxCm: 130 },
  thigh: { label: 'Thigh', description: 'Upper thigh circumference', minCm: 35, maxCm: 95 },
  knee: { label: 'Knee', description: 'Knee circumference', minCm: 25, maxCm: 65 },
  ankle: { label: 'Ankle', description: 'Ankle or hem target circumference', minCm: 18, maxCm: 55 },
  waistToHip: { label: 'Waist To Hip', description: 'Vertical waistline to hipline', minCm: 12, maxCm: 35 },
  skirtLength: { label: 'Skirt Length', description: 'Waistline to skirt hem', minCm: 30, maxCm: 120 },
  hoodDepth: { label: 'Hood Depth', description: 'Face opening depth over crown', minCm: 24, maxCm: 45 },
  hoodHeight: { label: 'Hood Height', description: 'Neck base to hood top', minCm: 28, maxCm: 52 },
  backLength: { label: 'Back Length', description: 'Center back neck to waist', minCm: 30, maxCm: 65 },
};

export const DEFAULT_MEASUREMENTS: BodyMeasurements = {
  bust: 88,
  chest: 96,
  waist: 70,
  hip: 96,
  shoulderWidth: 40,
  sleeveLength: 58,
  garmentLength: 65,
  armholeDepth: 21,
  neck: 38,
  wrist: 17,
  cuffOpening: 22,
  inseam: 76,
  outseam: 102,
  thigh: 55,
  knee: 40,
  ankle: 24,
  waistToHip: 20,
  skirtLength: 65,
  hoodDepth: 34,
  hoodHeight: 38,
  backLength: 42,
};

export const GARMENT_MEASUREMENT_KEYS: Record<GarmentType, MeasurementKey[]> = {
  tshirt: ['chest', 'waist', 'hip', 'shoulderWidth', 'sleeveLength', 'garmentLength', 'armholeDepth'],
  'dress-shirt': ['chest', 'waist', 'hip', 'neck', 'shoulderWidth', 'sleeveLength', 'wrist', 'cuffOpening', 'garmentLength', 'armholeDepth', 'backLength'],
  polo: ['chest', 'waist', 'hip', 'neck', 'shoulderWidth', 'sleeveLength', 'garmentLength', 'armholeDepth'],
  dress: ['bust', 'waist', 'hip', 'shoulderWidth', 'sleeveLength', 'garmentLength', 'waistToHip', 'skirtLength', 'armholeDepth'],
  trousers: ['waist', 'hip', 'inseam', 'outseam', 'thigh', 'knee', 'ankle'],
  skirt: ['waist', 'hip', 'waistToHip', 'skirtLength'],
  jacket: ['chest', 'waist', 'hip', 'neck', 'shoulderWidth', 'sleeveLength', 'garmentLength', 'armholeDepth', 'backLength'],
  coat: ['chest', 'waist', 'hip', 'neck', 'shoulderWidth', 'sleeveLength', 'garmentLength', 'armholeDepth', 'backLength'],
  shorts: ['waist', 'hip', 'inseam', 'outseam', 'thigh'],
  hoodie: ['chest', 'waist', 'hip', 'shoulderWidth', 'sleeveLength', 'garmentLength', 'hoodDepth', 'hoodHeight', 'armholeDepth'],
  sweatshirt: ['chest', 'waist', 'hip', 'shoulderWidth', 'sleeveLength', 'garmentLength', 'armholeDepth'],
  vest: ['chest', 'waist', 'hip', 'shoulderWidth', 'garmentLength', 'armholeDepth', 'backLength'],
};

export function getMeasurementsForGarment(garmentType: GarmentType): MeasurementKey[] {
  return GARMENT_MEASUREMENT_KEYS[garmentType];
}

export function isMeasurementValid(key: MeasurementKey, value: number): boolean {
  const meta = MEASUREMENT_LABELS[key];
  return value >= meta.minCm && value <= meta.maxCm;
}
