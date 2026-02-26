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

export interface BodyMeasurements {
  bust: number;
  waist: number;
  hip: number;
  shoulderWidth: number;
  sleeveLength: number;
  garmentLength: number;
  armholeDepth: number;
}

export type GarmentType = 'top' | 'dress' | 'shirt' | 'trousers';
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
    stretchH: 1.40,
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
    stretchV: 1.0,
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
  { value: 'top', label: 'Top / Blouse', description: 'Basic bodice with sleeves', icon: '👕' },
  { value: 'shirt', label: 'Shirt', description: 'Collared shirt with button placket', icon: '👔' },
  { value: 'dress', label: 'Dress', description: 'Full-length bodice and skirt', icon: '👗' },
  { value: 'trousers', label: 'Trousers', description: 'Pants with waistband', icon: '👖' },
];

export const MEASUREMENT_LABELS: Record<keyof BodyMeasurements, { label: string; description: string; minCm: number; maxCm: number }> = {
  bust: { label: 'Bust', description: 'Circumference at fullest point', minCm: 60, maxCm: 150 },
  waist: { label: 'Waist', description: 'Natural waistline circumference', minCm: 50, maxCm: 140 },
  hip: { label: 'Hip', description: 'Circumference at widest point', minCm: 65, maxCm: 160 },
  shoulderWidth: { label: 'Shoulder Width', description: 'Point to point across back', minCm: 30, maxCm: 60 },
  sleeveLength: { label: 'Sleeve Length', description: 'Shoulder point to wrist', minCm: 40, maxCm: 80 },
  garmentLength: { label: 'Garment Length', description: 'Nape to desired hem', minCm: 40, maxCm: 160 },
  armholeDepth: { label: 'Armhole Depth', description: 'Shoulder to underarm level', minCm: 15, maxCm: 35 },
};

export const DEFAULT_MEASUREMENTS: BodyMeasurements = {
  bust: 88,
  waist: 70,
  hip: 96,
  shoulderWidth: 40,
  sleeveLength: 58,
  garmentLength: 65,
  armholeDepth: 21,
};
