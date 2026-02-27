// Pattern generation engine for DSG Wear — v2 with realistic garment geometry
import { BodyMeasurements, FabricProperties, GarmentType } from '@/data/fabricData';

export interface PatternPoint {
  x: number;
  y: number;
}

export interface PatternCurve {
  type: 'line' | 'curve';
  points: PatternPoint[]; // for curve: [control1, control2?, end]
}

export interface PatternNotch {
  position: PatternPoint;
  type: 'single' | 'double' | 'triangle';
}

export interface PatternDart {
  tip: PatternPoint;
  left: PatternPoint;
  right: PatternPoint;
  label: string;
}

export interface PatternPiece {
  id: string;
  name: string;
  pathCommands: string; // SVG path d attribute
  points: PatternPoint[]; // key construction points
  annotations: { position: PatternPoint; label: string; value: string; angle?: number }[];
  grainLine?: { start: PatternPoint; end: PatternPoint };
  darts: PatternDart[];
  notches: PatternNotch[];
  seamAllowancePath?: string; // outer seam allowance SVG path
  width: number; // bounding width in cm
  height: number; // bounding height in cm
}

export interface GeneratedPattern {
  pieces: PatternPiece[];
  fabricAdjustments: string[];
  estimatedFabricUsage: number; // cm²
  seamAllowance: number;
}

function adj(value: number, fabric: FabricProperties, type: 'width' | 'length'): number {
  let v = value;
  const sf = type === 'width' ? fabric.stretchH : fabric.stretchV;
  if (fabric.elasticity > 15) {
    v -= (v * Math.min(fabric.elasticity * 0.15, 8)) / 100;
  }
  v /= sf;
  if (fabric.elasticity < 5 && fabric.tensileStrength > 70) v += 1.5;
  return Math.round(v * 10) / 10;
}

const GARMENT_EASE: Record<GarmentType, number> = {
  tshirt: 6,
  'dress-shirt': 8,
  polo: 6,
  dress: 6,
  trousers: 4,
  skirt: 3,
  jacket: 10,
  coat: 12,
  shorts: 4,
  hoodie: 8,
  sweatshirt: 7,
  vest: 6,
};

function ease(gt: GarmentType, f: FabricProperties): number {
  let e = GARMENT_EASE[gt];
  if (f.elasticity > 20) e *= 0.5;
  if (f.elasticity > 40) e *= 0.3;
  return e;
}

function seamAllow(f: FabricProperties): number {
  if (f.thickness > 0.6) return 2.0;
  if (f.tensileStrength < 40) return 1.8;
  return 1.5;
}

// Offset a polygon outward by `dist` cm (scaled) for seam allowance
function offsetPolygonPath(points: PatternPoint[], dist: number): string {
  if (points.length < 3) return '';
  const offset: PatternPoint[] = [];
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const prev = points[(i - 1 + n) % n];
    const curr = points[i];
    const next = points[(i + 1) % n];
    // edge normals
    const dx1 = curr.x - prev.x, dy1 = curr.y - prev.y;
    const dx2 = next.x - curr.x, dy2 = next.y - curr.y;
    const len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1) || 1;
    const len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2) || 1;
    const nx1 = -dy1 / len1, ny1 = dx1 / len1;
    const nx2 = -dy2 / len2, ny2 = dx2 / len2;
    const nx = (nx1 + nx2) / 2, ny = (ny1 + ny2) / 2;
    const nlen = Math.sqrt(nx * nx + ny * ny) || 1;
    offset.push({ x: curr.x + (nx / nlen) * dist, y: curr.y + (ny / nlen) * dist });
  }
  return offset.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') + ' Z';
}

const S = 3; // scale: 1cm = 3px

function addRectPiece(
  pieces: PatternPiece[],
  {
    id,
    name,
    width,
    height,
    sa,
    notchType = 'single',
  }: {
    id: string;
    name: string;
    width: number;
    height: number;
    sa: number;
    notchType?: PatternNotch['type'];
  }
) {
  const pts: PatternPoint[] = [
    { x: 0, y: 0 },
    { x: width * S, y: 0 },
    { x: width * S, y: height * S },
    { x: 0, y: height * S },
  ];
  const path = `M0,0 L${(width * S).toFixed(1)},0 L${(width * S).toFixed(1)},${(height * S).toFixed(1)} L0,${(height * S).toFixed(1)} Z`;
  pieces.push({
    id,
    name,
    pathCommands: path,
    points: pts,
    width,
    height,
    darts: [],
    notches: [{ position: { x: width * 0.5 * S, y: 0 }, type: notchType }],
    annotations: [{ position: { x: width * 0.5 * S, y: -10 }, label: name, value: `${width.toFixed(1)}x${height.toFixed(1)}cm` }],
    grainLine: { start: { x: width * 0.5 * S, y: 8 }, end: { x: width * 0.5 * S, y: height * S - 8 } },
    seamAllowancePath: offsetPolygonPath(pts, sa * S),
  });
}

export function generatePattern(
  m: BodyMeasurements,
  fabric: FabricProperties,
  gt: GarmentType
): GeneratedPattern {
  const easeVal = ease(gt, fabric);
  const sa = seamAllow(fabric);
  const adjustments: string[] = [];

  if (fabric.elasticity > 15) adjustments.push(`Negative ease applied (-${Math.min(fabric.elasticity * 0.15, 8).toFixed(1)}%) for ${fabric.name} stretch`);
  if (fabric.elasticity < 5 && fabric.tensileStrength > 70) adjustments.push(`Structural ease added (+1.5cm) for rigid ${fabric.name}`);
  if (fabric.drapeCoefficient > 0.7) adjustments.push(`High drape — curvature tolerances relaxed`);
  if (fabric.tensileStrength < 40) {
    adjustments.push(`Low tensile strength — reinforcement at stress points`);
    adjustments.push(`Seam allowance increased to ${sa}cm`);
  }

  const pieces: PatternPiece[] = [];
  const lowerBodyOnly = gt === 'trousers' || gt === 'shorts' || gt === 'skirt';
  const sleevedTop = gt !== 'vest' && gt !== 'skirt' && gt !== 'trousers' && gt !== 'shorts';

  // Adjusted measurements (half-body)
  const torsoCirc = gt === 'dress' ? m.bust : m.chest || m.bust;
  const hBust = adj((torsoCirc + easeVal) / 2, fabric, 'width');
  const hWaist = adj((m.waist + easeVal) / 2, fabric, 'width');
  const hHip = adj((m.hip + easeVal) / 2, fabric, 'width');
  const shW = adj(m.shoulderWidth / 2, fabric, 'width');
  const armD = adj(m.armholeDepth, fabric, 'length');
  const gLen = adj(m.garmentLength, fabric, 'length');
  const slLen = adj(m.sleeveLength, fabric, 'length');

  if (!lowerBodyOnly) {
    // ===== FRONT BODICE =====
    const fbW = hBust / 2;
    const neckW = shW * 0.35;
    const neckD = neckW * 0.9; // front neck depth
    const dartWidth = (fbW - hWaist / 2) * 0.4;
    const dartPos = fbW * 0.45;

    const fbPts: PatternPoint[] = [
      { x: neckW * S, y: 0 },                                    // neck point
      { x: shW * S, y: -2 * S },                                 // shoulder point (slight slope)
      { x: (shW + 1.5) * S, y: armD * 0.25 * S },               // armhole top curve
      { x: fbW * S, y: armD * 0.6 * S },                         // armhole mid
      { x: fbW * S, y: armD * S },                                // side bust
      { x: fbW * S, y: gLen * S },                                // side hem
      { x: 0, y: gLen * S },                                      // center hem
      { x: 0, y: neckD * S },                                     // center front neck
    ];

    const fbPath = `M${fbPts[0].x.toFixed(1)},${fbPts[0].y.toFixed(1)} ` +
      `L${fbPts[1].x.toFixed(1)},${fbPts[1].y.toFixed(1)} ` +
      `Q${fbPts[2].x.toFixed(1)},${fbPts[2].y.toFixed(1)} ${fbPts[3].x.toFixed(1)},${fbPts[3].y.toFixed(1)} ` +
      `L${fbPts[4].x.toFixed(1)},${fbPts[4].y.toFixed(1)} ` +
      `L${fbPts[5].x.toFixed(1)},${fbPts[5].y.toFixed(1)} ` +
      `L${fbPts[6].x.toFixed(1)},${fbPts[6].y.toFixed(1)} ` +
      `L${fbPts[7].x.toFixed(1)},${fbPts[7].y.toFixed(1)} ` +
      `Q${0},${0} ${fbPts[0].x.toFixed(1)},${fbPts[0].y.toFixed(1)} Z`;

    const frontDart: PatternDart = {
      tip: { x: dartPos * S, y: armD * 0.7 * S },
      left: { x: (dartPos - dartWidth / 2) * S, y: gLen * S },
      right: { x: (dartPos + dartWidth / 2) * S, y: gLen * S },
      label: `Waist dart ${dartWidth.toFixed(1)}cm`,
    };

    pieces.push({
      id: 'front-bodice',
      name: 'Front Bodice',
      pathCommands: fbPath,
      points: fbPts,
      width: fbW, height: gLen,
      darts: [frontDart],
      notches: [
        { position: { x: fbW * S, y: armD * 0.5 * S }, type: 'single' },
        { position: { x: fbW * 0.5 * S, y: gLen * S }, type: 'triangle' },
      ],
      annotations: [
        { position: { x: shW * S / 2, y: -15 }, label: 'Shoulder', value: `${shW.toFixed(1)}cm` },
        { position: { x: fbW * S + 20, y: armD * S / 2 }, label: 'Armhole', value: `${armD.toFixed(1)}cm`, angle: 90 },
        { position: { x: fbW * S / 2, y: gLen * S + 18 }, label: 'Width', value: `${fbW.toFixed(1)}cm` },
        { position: { x: -25, y: gLen * S / 2 }, label: 'Length', value: `${gLen.toFixed(1)}cm`, angle: -90 },
      ],
      grainLine: { start: { x: fbW * 0.3 * S, y: 15 }, end: { x: fbW * 0.3 * S, y: gLen * S - 15 } },
      seamAllowancePath: offsetPolygonPath(fbPts, sa * S),
    });

    // ===== BACK BODICE =====
    const bbNeckD = neckW * 0.3; // shallower back neck
    const bbPts: PatternPoint[] = [
      { x: neckW * S, y: 0 },
      { x: shW * S, y: -2.5 * S },
      { x: (shW + 1) * S, y: armD * 0.3 * S },
      { x: fbW * S, y: armD * 0.65 * S },
      { x: fbW * S, y: armD * S },
      { x: fbW * S, y: gLen * S },
      { x: 0, y: gLen * S },
      { x: 0, y: bbNeckD * S },
    ];

    const bbPath = `M${bbPts[0].x.toFixed(1)},${bbPts[0].y.toFixed(1)} ` +
      `L${bbPts[1].x.toFixed(1)},${bbPts[1].y.toFixed(1)} ` +
      `Q${bbPts[2].x.toFixed(1)},${bbPts[2].y.toFixed(1)} ${bbPts[3].x.toFixed(1)},${bbPts[3].y.toFixed(1)} ` +
      `L${bbPts[4].x.toFixed(1)},${bbPts[4].y.toFixed(1)} ` +
      `L${bbPts[5].x.toFixed(1)},${bbPts[5].y.toFixed(1)} ` +
      `L${bbPts[6].x.toFixed(1)},${bbPts[6].y.toFixed(1)} ` +
      `L${bbPts[7].x.toFixed(1)},${bbPts[7].y.toFixed(1)} ` +
      `Q${0},${0} ${bbPts[0].x.toFixed(1)},${bbPts[0].y.toFixed(1)} Z`;

    const backDart: PatternDart = {
      tip: { x: dartPos * S, y: armD * 0.8 * S },
      left: { x: (dartPos - dartWidth * 0.35) * S, y: gLen * S },
      right: { x: (dartPos + dartWidth * 0.35) * S, y: gLen * S },
      label: `Back dart ${(dartWidth * 0.7).toFixed(1)}cm`,
    };

    pieces.push({
      id: 'back-bodice',
      name: 'Back Bodice',
      pathCommands: bbPath,
      points: bbPts,
      width: fbW, height: gLen,
      darts: [backDart],
      notches: [
        { position: { x: fbW * S, y: armD * 0.5 * S }, type: 'double' },
      ],
      annotations: [
        { position: { x: shW * S / 2, y: -15 }, label: 'Shoulder', value: `${shW.toFixed(1)}cm` },
        { position: { x: fbW * S / 2, y: gLen * S + 18 }, label: 'Width', value: `${fbW.toFixed(1)}cm` },
        { position: { x: -25, y: gLen * S / 2 }, label: 'Length', value: `${gLen.toFixed(1)}cm`, angle: -90 },
      ],
      grainLine: { start: { x: fbW * 0.3 * S, y: 15 }, end: { x: fbW * 0.3 * S, y: gLen * S - 15 } },
      seamAllowancePath: offsetPolygonPath(bbPts, sa * S),
    });

    if (sleevedTop) {
      // ===== SLEEVE =====
      const slW = armD * 1.15;
      const capH = armD * 0.45;
      const wristW = slW * 0.7;
      const slPts: PatternPoint[] = [
        { x: 0, y: capH * S },
        { x: slW * 0.2 * S, y: capH * 0.3 * S },
        { x: slW * 0.5 * S, y: 0 },
        { x: slW * 0.8 * S, y: capH * 0.3 * S },
        { x: slW * S, y: capH * S },
        { x: (slW - (slW - wristW) / 2) * S, y: (capH + slLen) * S },
        { x: ((slW - wristW) / 2) * S, y: (capH + slLen) * S },
      ];

      const slPath = `M${slPts[0].x.toFixed(1)},${slPts[0].y.toFixed(1)} ` +
        `C${slPts[1].x.toFixed(1)},${slPts[1].y.toFixed(1)} ${slPts[1].x.toFixed(1)},${slPts[1].y.toFixed(1)} ${slPts[2].x.toFixed(1)},${slPts[2].y.toFixed(1)} ` +
        `C${slPts[3].x.toFixed(1)},${slPts[3].y.toFixed(1)} ${slPts[3].x.toFixed(1)},${slPts[3].y.toFixed(1)} ${slPts[4].x.toFixed(1)},${slPts[4].y.toFixed(1)} ` +
        `L${slPts[5].x.toFixed(1)},${slPts[5].y.toFixed(1)} ` +
        `L${slPts[6].x.toFixed(1)},${slPts[6].y.toFixed(1)} Z`;

      pieces.push({
        id: 'sleeve',
        name: 'Sleeve',
        pathCommands: slPath,
        points: slPts,
        width: slW, height: capH + slLen,
        darts: [],
        notches: [
          { position: { x: slW * 0.5 * S, y: 0 }, type: 'triangle' },
          { position: { x: 0, y: capH * S }, type: 'single' },
          { position: { x: slW * S, y: capH * S }, type: 'single' },
        ],
        annotations: [
          { position: { x: slW * S + 18, y: (capH + slLen / 2) * S }, label: 'Length', value: `${slLen.toFixed(1)}cm`, angle: 90 },
          { position: { x: slW * 0.5 * S, y: (capH + slLen) * S + 18 }, label: 'Wrist', value: `${wristW.toFixed(1)}cm` },
          { position: { x: slW * 0.5 * S, y: capH * S + 10 }, label: 'Bicep', value: `${slW.toFixed(1)}cm` },
        ],
        grainLine: { start: { x: slW * 0.5 * S, y: capH * 0.5 * S }, end: { x: slW * 0.5 * S, y: (capH + slLen) * S - 15 } },
        seamAllowancePath: offsetPolygonPath(slPts, sa * S),
      });
    }

    // ===== GARMENT-SPECIFIC EXTRAS =====
    if (gt === 'dress-shirt' || gt === 'polo') {
      const collarLen = neckW * 2 * Math.PI * 0.55; // approximate neck circumference portion
      const collarH = gt === 'polo' ? 3 : 4; // cm stand height
      const colPts: PatternPoint[] = [
        { x: 0, y: 0 },
        { x: collarLen * S, y: 0 },
        { x: (collarLen + 1.5) * S, y: collarH * 0.5 * S },
        { x: collarLen * S, y: collarH * S },
        { x: 0, y: collarH * S },
        { x: -1.5 * S, y: collarH * 0.5 * S },
      ];
      const colPath = colPts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') + ' Z';

      pieces.push({
        id: 'collar',
        name: 'Collar Stand',
        pathCommands: colPath,
        points: colPts,
        width: collarLen + 3, height: collarH,
        darts: [],
        notches: [
          { position: { x: collarLen * 0.5 * S, y: 0 }, type: 'single' },
        ],
        annotations: [
          { position: { x: collarLen * 0.5 * S, y: -10 }, label: 'Length', value: `${collarLen.toFixed(1)}cm` },
          { position: { x: collarLen * S + 25, y: collarH * 0.5 * S }, label: 'Height', value: `${collarH}cm` },
        ],
        grainLine: { start: { x: collarLen * 0.5 * S, y: 3 }, end: { x: collarLen * 0.5 * S, y: collarH * S - 3 } },
        seamAllowancePath: offsetPolygonPath(colPts, sa * S),
      });

      if (gt === 'dress-shirt') {
        addRectPiece(pieces, { id: 'cuff', name: 'Cuff', width: m.cuffOpening + 4, height: 7, sa, notchType: 'double' });
        addRectPiece(pieces, { id: 'front-placket', name: 'Front Placket', width: gLen, height: 4, sa });
      } else {
        addRectPiece(pieces, { id: 'polo-placket', name: 'Polo Placket', width: 16, height: 4, sa });
      }
    }

    if (gt === 'hoodie') {
      addRectPiece(pieces, { id: 'hood-band', name: 'Hood Band', width: m.hoodDepth, height: Math.max(4, m.hoodHeight * 0.2), sa, notchType: 'triangle' });
      addRectPiece(pieces, { id: 'rib-cuff', name: 'Rib Cuff', width: m.wrist + 3, height: 8, sa });
      addRectPiece(pieces, { id: 'rib-hem', name: 'Rib Hem', width: hHip * 2, height: 8, sa });
    }

    if (gt === 'sweatshirt') {
      addRectPiece(pieces, { id: 'rib-cuff', name: 'Rib Cuff', width: m.wrist + 2, height: 7, sa });
      addRectPiece(pieces, { id: 'rib-hem', name: 'Rib Hem', width: hHip * 2, height: 7, sa });
      addRectPiece(pieces, { id: 'neck-rib', name: 'Neck Rib', width: m.neck + 4, height: 5, sa });
    }

    if (gt === 'jacket' || gt === 'coat' || gt === 'vest') {
      addRectPiece(pieces, { id: 'front-facing', name: 'Front Facing', width: gLen, height: gt === 'coat' ? 9 : 7, sa, notchType: 'double' });
      addRectPiece(pieces, { id: 'pocket-welt', name: 'Pocket Welt', width: 14, height: 4, sa });
    }

    if (gt === 'coat') {
      addRectPiece(pieces, { id: 'back-vent', name: 'Back Vent Facing', width: 24, height: 8, sa });
    }
  }

  // ===== TROUSERS / SHORTS =====
  if (gt === 'trousers' || gt === 'shorts') {
    const outseam = adj(m.outseam, fabric, 'length');
    const inseam = gt === 'shorts' ? adj(Math.max(12, m.inseam * 0.35), fabric, 'length') : adj(m.inseam, fabric, 'length');
    const rise = outseam - inseam;
    const thighW = hHip * 0.55;
    const kneeW = thighW * 0.8;
    const hemW = gt === 'shorts' ? thighW * 0.9 : thighW * 0.7;
    const crotchExt = thighW * 0.15;

    // FRONT LEG
    const fPts: PatternPoint[] = [
      { x: 0, y: 0 },                                            // waist center
      { x: hWaist / 2 * S, y: 0 },                               // waist side
      { x: thighW * S, y: rise * 0.3 * S },                      // hip
      { x: thighW * S, y: rise * S },                             // crotch side
      { x: (thighW + crotchExt) * S, y: rise * S },              // crotch extension
      { x: kneeW * S, y: (rise + inseam * 0.55) * S },           // knee outer
      { x: hemW * S, y: outseam * S },                               // hem outer
      { x: (thighW - hemW) * 0.3 * S, y: outseam * S },             // hem inner
      { x: (thighW - kneeW) * 0.3 * S, y: (rise + inseam * 0.55) * S }, // knee inner
      { x: crotchExt * 0.5 * S, y: rise * S },                   // crotch inner
      { x: 0, y: rise * 0.7 * S },                               // front rise
    ];
    const fPath = fPts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') + ' Z';

    pieces.push({
      id: 'front-leg',
      name: 'Front Leg',
      pathCommands: fPath,
      points: fPts,
      width: thighW + crotchExt, height: outseam,
      darts: [],
      notches: [
        { position: { x: kneeW * 0.5 * S, y: (rise + inseam * 0.55) * S }, type: 'single' },
      ],
      annotations: [
        { position: { x: hWaist / 4 * S, y: -12 }, label: 'Waist', value: `${(hWaist / 2).toFixed(1)}cm` },
        { position: { x: thighW * S + 20, y: rise * 0.5 * S }, label: 'Rise', value: `${rise.toFixed(1)}cm`, angle: 90 },
        { position: { x: hemW * 0.5 * S, y: outseam * S + 18 }, label: 'Hem', value: `${hemW.toFixed(1)}cm` },
        { position: { x: -25, y: outseam * 0.5 * S }, label: gt === 'shorts' ? 'Length' : 'Full Length', value: `${outseam.toFixed(1)}cm`, angle: -90 },
      ],
      grainLine: { start: { x: thighW * 0.4 * S, y: 15 }, end: { x: thighW * 0.4 * S, y: outseam * S - 15 } },
      seamAllowancePath: offsetPolygonPath(fPts, sa * S),
    });

    // BACK LEG (wider)
    const bThighW = thighW * 1.1;
    const bCrotchExt = crotchExt * 1.8;
    const bHemW = hemW * 1.05;
    const bKneeW = kneeW * 1.05;
    const bPts: PatternPoint[] = [
      { x: -1 * S, y: -1 * S },
      { x: (hWaist / 2 + 2) * S, y: -1 * S },
      { x: bThighW * S, y: rise * 0.3 * S },
      { x: bThighW * S, y: rise * S },
      { x: (bThighW + bCrotchExt) * S, y: rise * S },
      { x: bKneeW * S, y: (rise + inseam * 0.55) * S },
      { x: bHemW * S, y: outseam * S },
      { x: (bThighW - bHemW) * 0.3 * S, y: outseam * S },
      { x: (bThighW - bKneeW) * 0.3 * S, y: (rise + inseam * 0.55) * S },
      { x: bCrotchExt * 0.3 * S, y: rise * S },
      { x: -1 * S, y: rise * 0.6 * S },
    ];
    const bPath = bPts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') + ' Z';

    const backDart: PatternDart = {
      tip: { x: hWaist / 4 * S, y: rise * 0.35 * S },
      left: { x: (hWaist / 4 - 1) * S, y: -1 * S },
      right: { x: (hWaist / 4 + 1) * S, y: -1 * S },
      label: 'Back dart 2cm',
    };

    pieces.push({
      id: 'back-leg',
      name: 'Back Leg',
      pathCommands: bPath,
      points: bPts,
      width: bThighW + bCrotchExt, height: outseam + 1,
      darts: [backDart],
      notches: [
        { position: { x: bKneeW * 0.5 * S, y: (rise + inseam * 0.55) * S }, type: 'double' },
      ],
      annotations: [
        { position: { x: hWaist / 4 * S, y: -20 }, label: 'Waist', value: `${(hWaist / 2 + 2).toFixed(1)}cm` },
        { position: { x: bHemW * 0.5 * S, y: outseam * S + 18 }, label: 'Hem', value: `${bHemW.toFixed(1)}cm` },
      ],
      grainLine: { start: { x: bThighW * 0.4 * S, y: 15 }, end: { x: bThighW * 0.4 * S, y: outseam * S - 15 } },
      seamAllowancePath: offsetPolygonPath(bPts, sa * S),
    });

    // WAISTBAND
    const wbLen = hWaist + 4; // with overlap
    const wbH = 4; // cm
    const wbPts: PatternPoint[] = [
      { x: 0, y: 0 },
      { x: wbLen * S, y: 0 },
      { x: wbLen * S, y: wbH * S },
      { x: 0, y: wbH * S },
    ];
    const wbPath = wbPts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') + ' Z';

    pieces.push({
      id: 'waistband',
      name: 'Waistband',
      pathCommands: wbPath,
      points: wbPts,
      width: wbLen, height: wbH,
      darts: [],
      notches: [
        { position: { x: wbLen * 0.5 * S, y: 0 }, type: 'single' },
        { position: { x: wbLen * 0.25 * S, y: 0 }, type: 'single' },
        { position: { x: wbLen * 0.75 * S, y: 0 }, type: 'single' },
      ],
      annotations: [
        { position: { x: wbLen * 0.5 * S, y: -10 }, label: 'Waistband', value: `${wbLen.toFixed(1)}cm` },
        { position: { x: wbLen * S + 15, y: wbH * 0.5 * S }, label: 'H', value: `${wbH}cm` },
      ],
      grainLine: { start: { x: 15, y: wbH * 0.5 * S }, end: { x: wbLen * S - 15, y: wbH * 0.5 * S } },
      seamAllowancePath: offsetPolygonPath(wbPts, sa * S),
    });
  }

  // ===== SKIRT =====
  if (gt === 'skirt') {
    const skirtLen = adj(m.skirtLength, fabric, 'length');
    const waistHalf = adj((m.waist + easeVal) / 2, fabric, 'width');
    const hipHalf = adj((m.hip + easeVal) / 2, fabric, 'width');
    const hemHalf = hipHalf * 1.18;
    const frontPts: PatternPoint[] = [
      { x: 0, y: 0 },
      { x: waistHalf * S, y: 0 },
      { x: hipHalf * S, y: skirtLen * 0.35 * S },
      { x: hemHalf * S, y: skirtLen * S },
      { x: 0, y: skirtLen * S },
    ];
    const backPts: PatternPoint[] = [
      { x: 0, y: 0 },
      { x: waistHalf * S, y: 0 },
      { x: hipHalf * 1.02 * S, y: skirtLen * 0.35 * S },
      { x: hemHalf * 1.04 * S, y: skirtLen * S },
      { x: -1.5 * S, y: skirtLen * S },
    ];
    const frontPath = frontPts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') + ' Z';
    const backPath = backPts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') + ' Z';

    pieces.push({
      id: 'front-skirt',
      name: 'Front Skirt',
      pathCommands: frontPath,
      points: frontPts,
      width: hemHalf,
      height: skirtLen,
      darts: [],
      notches: [{ position: { x: hipHalf * S, y: skirtLen * 0.35 * S }, type: 'single' }],
      annotations: [{ position: { x: waistHalf * 0.5 * S, y: -10 }, label: 'Waist', value: `${waistHalf.toFixed(1)}cm` }],
      grainLine: { start: { x: waistHalf * 0.5 * S, y: 10 }, end: { x: waistHalf * 0.5 * S, y: skirtLen * S - 10 } },
      seamAllowancePath: offsetPolygonPath(frontPts, sa * S),
    });
    pieces.push({
      id: 'back-skirt',
      name: 'Back Skirt',
      pathCommands: backPath,
      points: backPts,
      width: hemHalf * 1.04,
      height: skirtLen,
      darts: [],
      notches: [{ position: { x: hipHalf * 0.95 * S, y: skirtLen * 0.35 * S }, type: 'double' }],
      annotations: [{ position: { x: waistHalf * 0.5 * S, y: -10 }, label: 'Length', value: `${skirtLen.toFixed(1)}cm` }],
      grainLine: { start: { x: waistHalf * 0.5 * S, y: 10 }, end: { x: waistHalf * 0.5 * S, y: skirtLen * S - 10 } },
      seamAllowancePath: offsetPolygonPath(backPts, sa * S),
    });
    addRectPiece(pieces, { id: 'skirt-waistband', name: 'Waistband', width: waistHalf * 2 + 3, height: 6, sa });
  }

  // Dress extension: add skirt panel
  if (gt === 'dress' && gLen > 60) {
    const skirtLen = gLen * 0.45;
    const skirtHipW = hHip / 2;
    const skirtHemW = skirtHipW * 1.2; // slight flare
    const skPts: PatternPoint[] = [
      { x: 0, y: 0 },
      { x: skirtHipW * S, y: 0 },
      { x: skirtHemW * S, y: skirtLen * S },
      { x: -(skirtHemW - skirtHipW) * 0.2 * S, y: skirtLen * S },
    ];
    const skPath = skPts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') + ' Z';

    pieces.push({
      id: 'skirt-panel',
      name: 'Skirt Panel',
      pathCommands: skPath,
      points: skPts,
      width: skirtHemW, height: skirtLen,
      darts: [],
      notches: [],
      annotations: [
        { position: { x: skirtHipW * 0.5 * S, y: -10 }, label: 'Hip', value: `${skirtHipW.toFixed(1)}cm` },
        { position: { x: skirtHemW * 0.5 * S, y: skirtLen * S + 18 }, label: 'Hem', value: `${skirtHemW.toFixed(1)}cm` },
        { position: { x: skirtHemW * S + 15, y: skirtLen * 0.5 * S }, label: 'Length', value: `${skirtLen.toFixed(1)}cm` },
      ],
      grainLine: { start: { x: skirtHipW * 0.4 * S, y: 10 }, end: { x: skirtHipW * 0.4 * S, y: skirtLen * S - 10 } },
      seamAllowancePath: offsetPolygonPath(skPts, sa * S),
    });
  }

  // Fabric usage
  const totalArea = pieces.reduce((sum, p) => sum + p.width * p.height, 0);

  return {
    pieces,
    fabricAdjustments: adjustments,
    estimatedFabricUsage: Math.round(totalArea * 2.2),
    seamAllowance: sa,
  };
}

// Generate SVG string for export
export function patternToSVG(pattern: GeneratedPattern, garmentType: string, fabricName: string): string {
  // Calculate layout
  let currentX = 40;
  let currentY = 80;
  let maxRowH = 0;
  const positions: { x: number; y: number }[] = [];
  const padding = 60;
  const maxWidth = 900;

  for (const piece of pattern.pieces) {
    const pw = piece.width * S + padding * 2;
    const ph = piece.height * S + padding * 2;
    if (currentX + pw > maxWidth && currentX > 40) {
      currentX = 40;
      currentY += maxRowH + 40;
      maxRowH = 0;
    }
    positions.push({ x: currentX + padding, y: currentY + padding });
    currentX += pw + 20;
    maxRowH = Math.max(maxRowH, ph);
  }

  const totalH = currentY + maxRowH + padding + 60;
  const totalW = maxWidth + 40;

  let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalW} ${totalH}" width="${totalW}" height="${totalH}">
<style>
  text { font-family: monospace; }
  .piece-outline { fill: none; stroke: #000; stroke-width: 1.5; }
  .seam-line { fill: none; stroke: #999; stroke-width: 0.5; stroke-dasharray: 4 2; }
  .grain-line { stroke: #666; stroke-width: 0.8; stroke-dasharray: 6 3; }
  .annotation { font-size: 8px; fill: #333; }
  .piece-label { font-size: 11px; fill: #000; font-weight: bold; }
  .dart-line { fill: none; stroke: #000; stroke-width: 0.8; }
  .notch { fill: #000; }
  .title { font-size: 16px; fill: #000; font-weight: bold; }
  .subtitle { font-size: 10px; fill: #666; }
</style>
<rect width="100%" height="100%" fill="white"/>
<text x="20" y="30" class="title">DSG WEAR — ${garmentType.toUpperCase()} PATTERN</text>
<text x="20" y="48" class="subtitle">Fabric: ${fabricName} | Seam Allowance: ${pattern.seamAllowance}cm | Pieces: ${pattern.pieces.length}</text>
<line x1="20" y1="58" x2="${totalW - 20}" y2="58" stroke="#ddd" stroke-width="0.5"/>
`;

  pattern.pieces.forEach((piece, idx) => {
    const ox = positions[idx].x;
    const oy = positions[idx].y;

    svg += `<g transform="translate(${ox},${oy})">\n`;

    // Seam allowance
    if (piece.seamAllowancePath) {
      svg += `  <path d="${piece.seamAllowancePath}" class="seam-line"/>\n`;
    }

    // Main outline
    svg += `  <path d="${piece.pathCommands}" class="piece-outline"/>\n`;

    // Grain line
    if (piece.grainLine) {
      const g = piece.grainLine;
      svg += `  <line x1="${g.start.x}" y1="${g.start.y}" x2="${g.end.x}" y2="${g.end.y}" class="grain-line"/>\n`;
      svg += `  <polygon points="${g.start.x - 3},${g.start.y + 8} ${g.start.x + 3},${g.start.y + 8} ${g.start.x},${g.start.y}" class="notch"/>\n`;
    }

    // Darts
    piece.darts.forEach(d => {
      svg += `  <path d="M${d.left.x},${d.left.y} L${d.tip.x},${d.tip.y} L${d.right.x},${d.right.y}" class="dart-line"/>\n`;
      svg += `  <text x="${d.tip.x}" y="${d.tip.y - 5}" class="annotation" text-anchor="middle">${d.label}</text>\n`;
    });

    // Notches
    piece.notches.forEach(n => {
      if (n.type === 'triangle') {
        svg += `  <polygon points="${n.position.x - 3},${n.position.y} ${n.position.x + 3},${n.position.y} ${n.position.x},${n.position.y - 6}" class="notch"/>\n`;
      } else if (n.type === 'double') {
        svg += `  <line x1="${n.position.x - 2}" y1="${n.position.y - 5}" x2="${n.position.x - 2}" y2="${n.position.y + 5}" stroke="#000" stroke-width="1"/>\n`;
        svg += `  <line x1="${n.position.x + 2}" y1="${n.position.y - 5}" x2="${n.position.x + 2}" y2="${n.position.y + 5}" stroke="#000" stroke-width="1"/>\n`;
      } else {
        svg += `  <line x1="${n.position.x}" y1="${n.position.y - 5}" x2="${n.position.x}" y2="${n.position.y + 5}" stroke="#000" stroke-width="1.5"/>\n`;
      }
    });

    // Annotations
    piece.annotations.forEach(a => {
      const rot = a.angle ? ` transform="rotate(${a.angle},${a.position.x},${a.position.y})"` : '';
      svg += `  <text x="${a.position.x}" y="${a.position.y}" class="annotation" text-anchor="middle"${rot}>${a.label}: ${a.value}</text>\n`;
    });

    // Piece label
    const cx = piece.points.reduce((s, p) => s + p.x, 0) / piece.points.length;
    const cy = piece.points.reduce((s, p) => s + p.y, 0) / piece.points.length;
    svg += `  <text x="${cx}" y="${cy}" class="piece-label" text-anchor="middle">${piece.name}</text>\n`;

    svg += `</g>\n`;
  });

  svg += `</svg>`;
  return svg;
}

// Generate DXF string
export function patternToDXF(pattern: GeneratedPattern): string {
  let dxf = `0\nSECTION\n2\nHEADER\n0\nENDSEC\n`;
  dxf += `0\nSECTION\n2\nENTITIES\n`;

  let offsetY = 0;

  pattern.pieces.forEach(piece => {
    const pts = piece.points;
    // Convert from px to cm (divide by S=3)
    for (let i = 0; i < pts.length; i++) {
      const p1 = pts[i];
      const p2 = pts[(i + 1) % pts.length];
      dxf += `0\nLINE\n8\n0\n`;
      dxf += `10\n${(p1.x / S).toFixed(4)}\n20\n${((p1.y + offsetY) / S).toFixed(4)}\n30\n0.0\n`;
      dxf += `11\n${(p2.x / S).toFixed(4)}\n21\n${((p2.y + offsetY) / S).toFixed(4)}\n31\n0.0\n`;
    }

    // Darts
    piece.darts.forEach(d => {
      dxf += `0\nLINE\n8\n0\n10\n${(d.left.x / S).toFixed(4)}\n20\n${((d.left.y + offsetY) / S).toFixed(4)}\n30\n0.0\n11\n${(d.tip.x / S).toFixed(4)}\n21\n${((d.tip.y + offsetY) / S).toFixed(4)}\n31\n0.0\n`;
      dxf += `0\nLINE\n8\n0\n10\n${(d.right.x / S).toFixed(4)}\n20\n${((d.right.y + offsetY) / S).toFixed(4)}\n30\n0.0\n11\n${(d.tip.x / S).toFixed(4)}\n21\n${((d.tip.y + offsetY) / S).toFixed(4)}\n31\n0.0\n`;
    });

    offsetY += piece.height * S + 30;
  });

  dxf += `0\nENDSEC\n0\nEOF\n`;
  return dxf;
}

