// Pattern generation engine for DSG Wear
import { BodyMeasurements, FabricProperties, GarmentType } from '@/data/fabricData';

export interface PatternPoint {
  x: number;
  y: number;
}

export interface PatternPiece {
  id: string;
  name: string;
  points: PatternPoint[];
  annotations: { position: PatternPoint; label: string; value: string }[];
  grainLine?: { start: PatternPoint; end: PatternPoint };
}

export interface GeneratedPattern {
  pieces: PatternPiece[];
  fabricAdjustments: string[];
  estimatedFabricUsage: number; // in cm²
}

function applyFabricAdjustment(
  value: number,
  fabric: FabricProperties,
  type: 'width' | 'length'
): number {
  let adjusted = value;
  const stretchFactor = type === 'width' ? fabric.stretchH : fabric.stretchV;

  // Elastic fabrics: reduce pattern dimensions (negative ease)
  if (fabric.elasticity > 15) {
    const reduction = Math.min(fabric.elasticity * 0.15, 8);
    adjusted -= (adjusted * reduction) / 100;
  }

  // Account for stretch recovery
  adjusted /= stretchFactor;

  // Rigid fabrics: add structural ease
  if (fabric.elasticity < 5 && fabric.tensileStrength > 70) {
    adjusted += 1.5;
  }

  return Math.round(adjusted * 10) / 10;
}

function getEaseAllowance(garmentType: GarmentType, fabric: FabricProperties): number {
  const baseEase: Record<GarmentType, number> = {
    top: 6,
    shirt: 8,
    dress: 6,
    trousers: 4,
  };
  let ease = baseEase[garmentType];
  if (fabric.elasticity > 20) ease *= 0.5;
  if (fabric.elasticity > 40) ease *= 0.3;
  return ease;
}

function getSeamAllowance(fabric: FabricProperties): number {
  if (fabric.thickness > 0.6) return 2.0;
  if (fabric.tensileStrength < 40) return 1.8;
  return 1.5;
}

export function generatePattern(
  measurements: BodyMeasurements,
  fabric: FabricProperties,
  garmentType: GarmentType
): GeneratedPattern {
  const ease = getEaseAllowance(garmentType, fabric);
  const seam = getSeamAllowance(fabric);
  const adjustments: string[] = [];

  // Track adjustments
  if (fabric.elasticity > 15) {
    adjustments.push(`Negative ease applied (-${Math.min(fabric.elasticity * 0.15, 8).toFixed(1)}%) for ${fabric.name} stretch`);
  }
  if (fabric.elasticity < 5 && fabric.tensileStrength > 70) {
    adjustments.push(`Structural ease added (+1.5cm) for rigid ${fabric.name}`);
  }
  if (fabric.drapeCoefficient > 0.7) {
    adjustments.push(`High drape detected — curvature tolerances relaxed`);
  }
  if (fabric.tensileStrength < 40) {
    adjustments.push(`Low tensile strength — reinforcement recommended at stress points`);
    adjustments.push(`Increased seam allowance to ${seam}cm`);
  }

  const pieces: PatternPiece[] = [];

  // Half measurements for pattern
  const halfBust = applyFabricAdjustment((measurements.bust + ease) / 2, fabric, 'width');
  const halfWaist = applyFabricAdjustment((measurements.waist + ease) / 2, fabric, 'width');
  const halfHip = applyFabricAdjustment((measurements.hip + ease) / 2, fabric, 'width');
  const shoulderW = applyFabricAdjustment(measurements.shoulderWidth / 2, fabric, 'width');
  const armhole = applyFabricAdjustment(measurements.armholeDepth, fabric, 'length');
  const length = applyFabricAdjustment(measurements.garmentLength, fabric, 'length');

  // Scale for SVG (1cm = 3px)
  const s = 3;

  // FRONT BODICE
  const frontBodice: PatternPiece = {
    id: 'front-bodice',
    name: 'Front Bodice',
    points: [
      { x: 0, y: 0 },
      { x: shoulderW * s, y: 0 },
      { x: (shoulderW + 2) * s, y: armhole * 0.3 * s },
      { x: halfBust / 2 * s, y: armhole * s },
      { x: halfBust / 2 * s, y: length * s },
      { x: 0, y: length * s },
    ],
    annotations: [
      { position: { x: shoulderW * s / 2, y: -10 }, label: 'Shoulder', value: `${shoulderW}cm` },
      { position: { x: halfBust / 2 * s + 15, y: armhole * s }, label: 'Bust/2', value: `${(halfBust / 2).toFixed(1)}cm` },
      { position: { x: -30, y: length * s / 2 }, label: 'Length', value: `${length}cm` },
    ],
    grainLine: {
      start: { x: halfBust / 4 * s, y: 20 },
      end: { x: halfBust / 4 * s, y: length * s - 20 },
    },
  };
  pieces.push(frontBodice);

  // BACK BODICE
  const backBodice: PatternPiece = {
    id: 'back-bodice',
    name: 'Back Bodice',
    points: [
      { x: 0, y: 0 },
      { x: shoulderW * s, y: 0 },
      { x: (shoulderW + 1.5) * s, y: armhole * 0.35 * s },
      { x: halfBust / 2 * s, y: armhole * s },
      { x: halfBust / 2 * s, y: length * s },
      { x: 0, y: length * s },
    ],
    annotations: [
      { position: { x: shoulderW * s / 2, y: -10 }, label: 'Shoulder', value: `${shoulderW}cm` },
      { position: { x: -30, y: length * s / 2 }, label: 'Length', value: `${length}cm` },
    ],
    grainLine: {
      start: { x: halfBust / 4 * s, y: 20 },
      end: { x: halfBust / 4 * s, y: length * s - 20 },
    },
  };
  pieces.push(backBodice);

  // SLEEVE
  if (garmentType !== 'trousers') {
    const sleeveLen = applyFabricAdjustment(measurements.sleeveLength, fabric, 'length');
    const sleeveWidth = armhole * 1.1;
    const sleeve: PatternPiece = {
      id: 'sleeve',
      name: 'Sleeve',
      points: [
        { x: 0, y: 0 },
        { x: sleeveWidth / 2 * s, y: -armhole * 0.4 * s },
        { x: sleeveWidth * s, y: 0 },
        { x: sleeveWidth * 0.85 * s, y: sleeveLen * s },
        { x: sleeveWidth * 0.15 * s, y: sleeveLen * s },
      ],
      annotations: [
        { position: { x: sleeveWidth * s + 15, y: sleeveLen * s / 2 }, label: 'Length', value: `${sleeveLen}cm` },
        { position: { x: sleeveWidth / 2 * s, y: sleeveLen * s + 18 }, label: 'Width', value: `${sleeveWidth.toFixed(1)}cm` },
      ],
      grainLine: {
        start: { x: sleeveWidth / 2 * s, y: 10 },
        end: { x: sleeveWidth / 2 * s, y: sleeveLen * s - 10 },
      },
    };
    pieces.push(sleeve);
  }

  // Estimate fabric usage
  const totalArea = pieces.reduce((sum, piece) => {
    // Simple bounding box estimate
    const xs = piece.points.map(p => p.x);
    const ys = piece.points.map(p => p.y);
    const w = Math.max(...xs) - Math.min(...xs);
    const h = Math.max(...ys) - Math.min(...ys);
    return sum + (w * h) / (s * s); // convert back to cm²
  }, 0);

  return {
    pieces,
    fabricAdjustments: adjustments,
    estimatedFabricUsage: Math.round(totalArea * 2.2), // account for 2 of each piece + waste
  };
}
