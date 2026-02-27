import { useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useWorkflow } from '@/contexts/WorkflowContext';
import { generatePattern, PatternPiece } from '@/lib/patternEngine';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { BodyMeasurements, FabricProperties, GarmentType } from '@/data/fabricData';

function NotchSVG({ x, y, type }: { x: number; y: number; type: string }) {
  if (type === 'triangle') {
    return <polygon points={`${x - 3},${y} ${x + 3},${y} ${x},${y - 6}`} fill="hsl(186 100% 50% / 0.8)" />;
  }
  if (type === 'double') {
    return (
      <g>
        <line x1={x - 2} y1={y - 5} x2={x - 2} y2={y + 5} stroke="hsl(186 100% 50% / 0.8)" strokeWidth="1" />
        <line x1={x + 2} y1={y - 5} x2={x + 2} y2={y + 5} stroke="hsl(186 100% 50% / 0.8)" strokeWidth="1" />
      </g>
    );
  }
  return <line x1={x} y1={y - 5} x2={x} y2={y + 5} stroke="hsl(186 100% 50% / 0.8)" strokeWidth="1.5" />;
}

function PieceSVG({ piece, ox, oy, showSeam, showAnnotations }: {
  piece: PatternPiece; ox: number; oy: number; showSeam: boolean; showAnnotations: boolean;
}) {
  return (
    <g transform={`translate(${ox},${oy})`}>
      {/* Seam allowance */}
      {showSeam && piece.seamAllowancePath && (
        <path d={piece.seamAllowancePath} fill="none" stroke="hsl(38 92% 50% / 0.3)" strokeWidth="0.8" strokeDasharray="4 2" />
      )}

      {/* Main outline */}
      <path d={piece.pathCommands} fill="hsl(186 100% 50% / 0.04)" stroke="hsl(186 100% 50% / 0.8)" strokeWidth="1.5" />

      {/* Grain line */}
      {piece.grainLine && (
        <g>
          <line
            x1={piece.grainLine.start.x} y1={piece.grainLine.start.y}
            x2={piece.grainLine.end.x} y2={piece.grainLine.end.y}
            stroke="hsl(186 60% 30% / 0.5)" strokeWidth="0.8" strokeDasharray="6 3"
          />
          <polygon
            points={`${piece.grainLine.start.x - 3},${piece.grainLine.start.y + 8} ${piece.grainLine.start.x + 3},${piece.grainLine.start.y + 8} ${piece.grainLine.start.x},${piece.grainLine.start.y}`}
            fill="hsl(186 60% 30% / 0.5)"
          />
        </g>
      )}

      {/* Darts */}
      {piece.darts.map((d, i) => (
        <g key={i}>
          <path
            d={`M${d.left.x},${d.left.y} L${d.tip.x},${d.tip.y} L${d.right.x},${d.right.y}`}
            fill="none" stroke="hsl(0 72% 51% / 0.6)" strokeWidth="1"
          />
          {showAnnotations && (
            <text x={d.tip.x} y={d.tip.y - 6} textAnchor="middle" fill="hsl(0 72% 51% / 0.7)" fontSize="7" fontFamily="JetBrains Mono">
              {d.label}
            </text>
          )}
        </g>
      ))}

      {/* Notches */}
      {piece.notches.map((n, i) => (
        <NotchSVG key={i} x={n.position.x} y={n.position.y} type={n.type} />
      ))}

      {/* Annotations */}
      {showAnnotations && piece.annotations.map((a, i) => (
        <text
          key={i} x={a.position.x} y={a.position.y} textAnchor="middle"
          fill="hsl(210 40% 85% / 0.6)" fontSize="7.5" fontFamily="JetBrains Mono"
          transform={a.angle ? `rotate(${a.angle},${a.position.x},${a.position.y})` : undefined}
        >
          {a.label}: {a.value}
        </text>
      ))}

      {/* Piece label */}
      <text
        x={piece.points.reduce((s, p) => s + p.x, 0) / piece.points.length}
        y={piece.points.reduce((s, p) => s + p.y, 0) / piece.points.length}
        textAnchor="middle" fill="hsl(186 100% 50% / 0.5)" fontSize="10" fontFamily="JetBrains Mono" fontWeight="bold"
      >
        {piece.name}
      </text>
    </g>
  );
}

function GarmentMockup({
  garmentType,
  measurements,
  fabric,
}: {
  garmentType: GarmentType;
  measurements: BodyMeasurements;
  fabric: FabricProperties;
}) {
  const isBottomOnly = garmentType === 'trousers' || garmentType === 'shorts' || garmentType === 'skirt';
  const isDress = garmentType === 'dress';
  const isSleeveless = garmentType === 'vest';
  const hasHood = garmentType === 'hoodie';
  const isLongOuter = garmentType === 'coat';
  const isLower = garmentType === 'trousers' || garmentType === 'shorts' || garmentType === 'skirt';
  const isShirt = garmentType === 'dress-shirt' || garmentType === 'polo';
  const isTailored = garmentType === 'jacket' || garmentType === 'coat' || garmentType === 'vest';
  const hasFrontOpening = isShirt || isTailored;
  const hasWaistSeam = garmentType === 'dress';

  const baseLen = isDress
    ? Math.min(220, 120 + measurements.skirtLength * 1.1)
    : isLongOuter
    ? Math.min(220, 120 + measurements.garmentLength * 0.9)
    : isLower
    ? Math.min(210, 90 + measurements.outseam * 0.9)
    : Math.min(180, 90 + measurements.garmentLength * 0.75);

  const shoulder = 60 + measurements.shoulderWidth * 0.9;
  const waist = 45 + measurements.waist * 0.35;
  const hip = 52 + measurements.hip * 0.35;
  const hem = isDress ? hip * 1.35 : isLongOuter ? hip * 1.15 : hip * 1.02;
  const sleeve = isSleeveless || isBottomOnly ? 0 : Math.min(95, 35 + measurements.sleeveLength * 0.8);

  const leftShoulder = 160 - shoulder / 2;
  const rightShoulder = 160 + shoulder / 2;
  const leftWaist = 160 - waist / 2;
  const rightWaist = 160 + waist / 2;
  const leftHip = 160 - hip / 2;
  const rightHip = 160 + hip / 2;
  const leftHem = 160 - hem / 2;
  const rightHem = 160 + hem / 2;
  const topY = 40;
  const armY = 78;
  const waistY = 120;
  const hipY = 155;
  const hemY = topY + baseLen;

  const topFrontPath = [
    `M ${leftShoulder} ${topY + 5}`,
    `Q 160 ${topY - 2} ${rightShoulder} ${topY + 5}`,
    sleeve > 0 ? `L ${rightShoulder + sleeve * 0.35} ${armY + 8}` : `L ${rightShoulder} ${armY}`,
    sleeve > 0 ? `Q ${rightShoulder + sleeve * 0.7} ${armY + 35} ${rightShoulder + sleeve * 0.45} ${armY + sleeve}` : '',
    sleeve > 0 ? `L ${rightHip + 8} ${hipY + 10}` : `L ${rightHip} ${hipY}`,
    `Q ${rightWaist + 4} ${waistY} ${rightWaist} ${waistY + 2}`,
    `L ${rightHip} ${hipY}`,
    `L ${rightHem} ${hemY}`,
    `Q 160 ${hemY + 4} ${leftHem} ${hemY}`,
    `L ${leftHip} ${hipY}`,
    `L ${leftWaist} ${waistY + 2}`,
    `Q ${leftWaist - 4} ${waistY} ${leftHip} ${hipY}`,
    sleeve > 0 ? `L ${leftShoulder - sleeve * 0.45} ${armY + sleeve}` : `L ${leftHip} ${hipY}`,
    sleeve > 0 ? `Q ${leftShoulder - sleeve * 0.7} ${armY + 35} ${leftShoulder - sleeve * 0.35} ${armY + 8}` : '',
    `L ${leftShoulder} ${topY + 5}`,
    'Z',
  ]
    .filter(Boolean)
    .join(' ');

  const topBackPath = [
    `M ${leftShoulder} ${topY + 8}`,
    `Q 160 ${topY + 6} ${rightShoulder} ${topY + 8}`,
    sleeve > 0 ? `L ${rightShoulder + sleeve * 0.32} ${armY + 10}` : `L ${rightShoulder} ${armY}`,
    sleeve > 0 ? `Q ${rightShoulder + sleeve * 0.62} ${armY + 35} ${rightShoulder + sleeve * 0.4} ${armY + sleeve}` : '',
    `L ${rightHip + (isLongOuter ? 6 : 0)} ${hipY + (isLongOuter ? 10 : 0)}`,
    `L ${rightHem} ${hemY}`,
    `Q 160 ${hemY + 2} ${leftHem} ${hemY}`,
    `L ${leftHip - (isLongOuter ? 6 : 0)} ${hipY + (isLongOuter ? 10 : 0)}`,
    sleeve > 0 ? `L ${leftShoulder - sleeve * 0.4} ${armY + sleeve}` : `L ${leftHip} ${hipY}`,
    sleeve > 0 ? `Q ${leftShoulder - sleeve * 0.62} ${armY + 35} ${leftShoulder - sleeve * 0.32} ${armY + 10}` : '',
    `L ${leftShoulder} ${topY + 8}`,
    'Z',
  ]
    .filter(Boolean)
    .join(' ');

  const trousersFront = `
    M 110 42
    Q 160 35 210 42
    L 195 ${100 + baseLen * 0.15}
    L 176 ${60 + baseLen}
    L 150 ${60 + baseLen}
    L 140 ${130 + baseLen * 0.18}
    L 125 ${60 + baseLen}
    L 95 ${60 + baseLen}
    L 110 ${100 + baseLen * 0.15}
    Z
  `;
  const shortsFront = `
    M 110 42
    Q 160 35 210 42
    L 198 116
    L 174 156
    L 148 156
    L 140 126
    L 132 156
    L 104 156
    L 110 116
    Z
  `;
  const skirtFront = `
    M 120 50
    Q 160 44 200 50
    L 226 ${80 + baseLen}
    Q 160 ${95 + baseLen} 94 ${80 + baseLen}
    Z
  `;
  const skirtBack = `
    M 120 52
    Q 160 48 200 52
    L 222 ${80 + baseLen}
    Q 160 ${93 + baseLen} 98 ${80 + baseLen}
    Z
  `;

  const fill = fabric.category === 'knit' ? 'hsl(186 100% 50% / 0.24)' : 'hsl(186 70% 40% / 0.22)';
  const stroke = 'hsl(186 100% 50% / 0.85)';
  const accent = 'hsl(186 100% 50% / 0.65)';

  const renderFront = () => {
    if (garmentType === 'trousers') {
      return (
        <>
          <path d={trousersFront} fill={fill} stroke={stroke} strokeWidth="2" />
          <line x1="160" y1="56" x2="160" y2={110 + baseLen * 0.24} stroke={accent} strokeWidth="1.6" />
          <path d={`M 124 76 Q 138 92 150 88`} fill="none" stroke={accent} strokeWidth="1.4" />
          <path d={`M 196 76 Q 182 92 170 88`} fill="none" stroke={accent} strokeWidth="1.4" />
        </>
      );
    }
    if (garmentType === 'shorts') {
      return (
        <>
          <path d={shortsFront} fill={fill} stroke={stroke} strokeWidth="2" />
          <line x1="160" y1="56" x2="160" y2="116" stroke={accent} strokeWidth="1.6" />
          <path d="M 126 76 Q 138 89 149 86" fill="none" stroke={accent} strokeWidth="1.3" />
          <path d="M 194 76 Q 182 89 171 86" fill="none" stroke={accent} strokeWidth="1.3" />
        </>
      );
    }
    if (garmentType === 'skirt') {
      return (
        <>
          <path d={skirtFront} fill={fill} stroke={stroke} strokeWidth="2" />
          <line x1="160" y1="60" x2="160" y2={70 + baseLen * 0.95} stroke={accent} strokeWidth="1.3" strokeDasharray="3 4" />
        </>
      );
    }
    return (
      <>
        <path d={topFrontPath} fill={fill} stroke={stroke} strokeWidth="2" />
        {hasHood && (
          <path
            d={`M 124 ${topY + 12} Q 160 ${topY - 18} 196 ${topY + 12} L 186 ${topY + 36} Q 160 ${topY + 22} 134 ${topY + 36} Z`}
            fill="hsl(186 100% 50% / 0.18)"
            stroke={accent}
            strokeWidth="1.6"
          />
        )}
        {hasFrontOpening && (
          <line x1="160" y1={topY + 24} x2="160" y2={hemY - 4} stroke={accent} strokeWidth="1.5" strokeDasharray="4 3" />
        )}
        {garmentType === 'dress-shirt' && (
          <>
            <path d={`M ${leftShoulder + 20} ${topY + 8} L 160 ${topY + 28} L ${rightShoulder - 20} ${topY + 8}`} fill="none" stroke={accent} strokeWidth="1.5" />
            <circle cx="160" cy={topY + 52} r="1.5" fill={accent} />
            <circle cx="160" cy={topY + 70} r="1.5" fill={accent} />
            <circle cx="160" cy={topY + 88} r="1.5" fill={accent} />
          </>
        )}
        {garmentType === 'polo' && (
          <>
            <path d={`M ${leftShoulder + 26} ${topY + 10} L 160 ${topY + 26} L ${rightShoulder - 26} ${topY + 10}`} fill="none" stroke={accent} strokeWidth="1.4" />
            <line x1="160" y1={topY + 26} x2="160" y2={topY + 68} stroke={accent} strokeWidth="1.4" />
          </>
        )}
        {isTailored && (
          <>
            <path d={`M ${leftShoulder + 18} ${topY + 10} L 154 ${topY + 52} L 145 ${topY + 88}`} fill="none" stroke={accent} strokeWidth="1.6" />
            <path d={`M ${rightShoulder - 18} ${topY + 10} L 166 ${topY + 52} L 175 ${topY + 88}`} fill="none" stroke={accent} strokeWidth="1.6" />
          </>
        )}
        {hasWaistSeam && <line x1={leftWaist - 4} y1={waistY + 10} x2={rightWaist + 4} y2={waistY + 10} stroke={accent} strokeWidth="1.2" />}
      </>
    );
  };

  const renderBack = () => {
    if (garmentType === 'trousers') {
      return (
        <>
          <path d={trousersFront} fill={fill} stroke={stroke} strokeWidth="2" />
          <line x1="116" y1="70" x2="204" y2="70" stroke={accent} strokeWidth="1.4" />
          <path d="M 120 82 Q 136 92 148 88" fill="none" stroke={accent} strokeWidth="1.2" />
          <path d="M 200 82 Q 184 92 172 88" fill="none" stroke={accent} strokeWidth="1.2" />
        </>
      );
    }
    if (garmentType === 'shorts') {
      return (
        <>
          <path d={shortsFront} fill={fill} stroke={stroke} strokeWidth="2" />
          <line x1="116" y1="70" x2="204" y2="70" stroke={accent} strokeWidth="1.4" />
        </>
      );
    }
    if (garmentType === 'skirt') {
      return (
        <>
          <path d={skirtBack} fill={fill} stroke={stroke} strokeWidth="2" />
          <line x1="160" y1="58" x2="160" y2={68 + baseLen * 0.9} stroke={accent} strokeWidth="1.2" strokeDasharray="5 4" />
        </>
      );
    }
    return (
      <>
        <path d={topBackPath} fill={fill} stroke={stroke} strokeWidth="2" />
        {hasHood && (
          <path
            d={`M 128 ${topY + 10} Q 160 ${topY - 25} 192 ${topY + 10} L 198 ${topY + 48} Q 160 ${topY + 62} 122 ${topY + 48} Z`}
            fill="hsl(186 100% 50% / 0.16)"
            stroke={accent}
            strokeWidth="1.8"
          />
        )}
        {(garmentType === 'dress-shirt' || garmentType === 'polo') && (
          <path d={`M ${leftShoulder + 20} ${topY + 16} Q 160 ${topY + 2} ${rightShoulder - 20} ${topY + 16}`} fill="none" stroke={accent} strokeWidth="1.3" />
        )}
        {garmentType === 'jacket' || garmentType === 'coat' ? (
          <line x1="160" y1={hemY - 36} x2="160" y2={hemY} stroke={accent} strokeWidth="1.5" />
        ) : null}
        {garmentType === 'vest' ? (
          <line x1="160" y1={topY + 28} x2="160" y2={hemY - 4} stroke={accent} strokeWidth="1.2" strokeDasharray="3 4" />
        ) : null}
      </>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div className="bg-card rounded-lg border border-border p-3">
        <p className="text-[10px] font-mono text-muted-foreground mb-2">FRONT VIEW</p>
        <svg viewBox="0 0 320 300" className="w-full h-[260px]">
          <rect x="1" y="1" width="318" height="298" rx="10" fill="hsl(222 44% 9% / 0.55)" stroke="hsl(186 100% 50% / 0.15)" />
          {renderFront()}
        </svg>
      </div>
      <div className="bg-card rounded-lg border border-border p-3">
        <p className="text-[10px] font-mono text-muted-foreground mb-2">BACK VIEW</p>
        <svg viewBox="0 0 320 300" className="w-full h-[260px]">
          <rect x="1" y="1" width="318" height="298" rx="10" fill="hsl(222 44% 9% / 0.55)" stroke="hsl(186 100% 50% / 0.15)" />
          {renderBack()}
        </svg>
      </div>
    </div>
  );
}

export default function PatternPreviewStep() {
  const { state } = useWorkflow();
  const [zoom, setZoom] = useState(1);
  const [showSeam, setShowSeam] = useState(true);
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [fullBodiceView, setFullBodiceView] = useState(false);

  const pattern = useMemo(() => {
    if (!state.garmentType) return null;
    return generatePattern(state.measurements, state.fabric, state.garmentType);
  }, [state.measurements, state.fabric, state.garmentType]);

  const frontBodice = useMemo(
    () => pattern?.pieces.find(p => p.id === 'front-bodice'),
    [pattern]
  );
  const backBodice = useMemo(
    () => pattern?.pieces.find(p => p.id === 'back-bodice'),
    [pattern]
  );

  if (!pattern) return <p className="text-muted-foreground">Select a garment type first</p>;

  // Layout pieces in rows
  const padding = 60;
  let cx = padding, cy = padding, maxRowH = 0;
  const positions: { x: number; y: number }[] = [];
  const maxW = 800;

  for (const piece of pattern.pieces) {
    const pw = piece.width * 3 + padding * 2;
    const ph = piece.height * 3 + padding * 2;
    if (cx + pw > maxW && cx > padding) {
      cx = padding;
      cy += maxRowH + 30;
      maxRowH = 0;
    }
    positions.push({ x: cx + padding, y: cy + padding });
    cx += pw + 20;
    maxRowH = Math.max(maxRowH, ph);
  }
  const svgH = cy + maxRowH + padding + 30;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Generated Pattern</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {pattern.pieces.length} pieces • {state.fabric.name} • SA: {pattern.seamAllowance}cm
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}><ZoomOut size={14} /></Button>
          <span className="text-xs font-mono text-muted-foreground w-10 text-center">{(zoom * 100).toFixed(0)}%</span>
          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setZoom(z => Math.min(3, z + 0.25))}><ZoomIn size={14} /></Button>
          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setZoom(1)}><RotateCcw size={14} /></Button>
        </div>
      </div>

      <div className="flex gap-1 bg-secondary rounded-md p-1 w-fit">
        <button
          onClick={() => setFullBodiceView(false)}
          className={`px-3 py-1 text-xs font-mono rounded transition-colors ${
            !fullBodiceView ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Half pattern (production)
        </button>
        <button
          onClick={() => setFullBodiceView(true)}
          className={`px-3 py-1 text-xs font-mono rounded transition-colors ${
            fullBodiceView ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Full mirrored garment view
        </button>
      </div>

      {/* Toggle controls */}
      <div className="flex gap-6">
        <div className="flex items-center gap-2">
          <Switch id="seam" checked={showSeam} onCheckedChange={setShowSeam} />
          <Label htmlFor="seam" className="text-xs text-muted-foreground">Seam allowance</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch id="ann" checked={showAnnotations} onCheckedChange={setShowAnnotations} />
          <Label htmlFor="ann" className="text-xs text-muted-foreground">Annotations</Label>
        </div>
      </div>

      {/* Fabric adjustments */}
      {pattern.fabricAdjustments.length > 0 && (
        <div className="bg-secondary/50 rounded-lg p-3 border border-border">
          <h4 className="text-[10px] font-mono font-semibold text-primary mb-2">FABRIC ADJUSTMENTS APPLIED</h4>
          <ul className="space-y-1">
            {pattern.fabricAdjustments.map((adj, i) => (
              <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                <span className="text-primary mt-0.5">▸</span> {adj}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Garment look preview */}
      {state.garmentType && (
        <div className="space-y-2">
          <h4 className="text-[10px] font-mono font-semibold text-primary">FINISHED GARMENT PREVIEW</h4>
          <GarmentMockup
            garmentType={state.garmentType}
            measurements={state.measurements}
            fabric={state.fabric}
          />
        </div>
      )}

      {/* SVG Pattern View */}
      {!fullBodiceView ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-card rounded-lg border border-border overflow-auto blueprint-grid"
          style={{ maxHeight: 500 }}
        >
          <svg
            viewBox={`0 0 ${maxW} ${svgH}`}
            width={maxW * zoom}
            height={svgH * zoom}
            className="min-w-full"
          >
            {pattern.pieces.map((piece, i) => (
              <PieceSVG
                key={piece.id}
                piece={piece}
                ox={positions[i].x}
                oy={positions[i].y}
                showSeam={showSeam}
                showAnnotations={showAnnotations}
              />
            ))}
          </svg>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[frontBodice, backBodice].map((piece, idx) => {
            if (!piece) return null;
            const w = piece.width * 3;
            const h = piece.height * 3;
            const pad = 22;
            const centerX = pad + w;
            const viewW = pad + w * 2 + pad;
            const viewH = pad + h + pad;
            return (
              <div key={piece.id} className="bg-card rounded-lg border border-border p-3">
                <p className="text-[10px] font-mono text-muted-foreground mb-2">{idx === 0 ? 'FRONT BODICE (MIRRORED)' : 'BACK BODICE (MIRRORED)'}</p>
                <svg viewBox={`0 0 ${viewW} ${viewH}`} className="w-full h-[300px] blueprint-grid">
                  <rect x="1" y="1" width={viewW - 2} height={viewH - 2} rx="10" fill="hsl(222 44% 9% / 0.45)" stroke="hsl(186 100% 50% / 0.15)" />
                  <line x1={centerX} y1={8} x2={centerX} y2={viewH - 8} stroke="hsl(186 100% 50% / 0.45)" strokeDasharray="5 4" strokeWidth="1.2" />
                  <g transform={`translate(${centerX},${pad})`}>
                    {showSeam && piece.seamAllowancePath && (
                      <path d={piece.seamAllowancePath} fill="none" stroke="hsl(38 92% 50% / 0.3)" strokeWidth="0.8" strokeDasharray="4 2" />
                    )}
                    <path d={piece.pathCommands} fill="hsl(186 100% 50% / 0.05)" stroke="hsl(186 100% 50% / 0.85)" strokeWidth="1.5" />
                  </g>
                  <g transform={`translate(${centerX},${pad}) scale(-1,1)`}>
                    {showSeam && piece.seamAllowancePath && (
                      <path d={piece.seamAllowancePath} fill="none" stroke="hsl(38 92% 50% / 0.3)" strokeWidth="0.8" strokeDasharray="4 2" />
                    )}
                    <path d={piece.pathCommands} fill="hsl(186 100% 50% / 0.05)" stroke="hsl(186 100% 50% / 0.85)" strokeWidth="1.5" />
                  </g>
                </svg>
              </div>
            );
          })}
          {!frontBodice && !backBodice && (
            <div className="md:col-span-2 bg-card rounded-lg border border-border p-4 text-sm text-muted-foreground">
              Full mirrored bodice view is not available for this garment type. Use half pattern view for piece layout.
            </div>
          )}
        </motion.div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-secondary/50 rounded-lg p-3 border border-border text-center">
          <p className="text-[10px] font-mono text-muted-foreground">PIECES</p>
          <p className="text-2xl font-bold text-primary font-mono">{pattern.pieces.length}</p>
        </div>
        <div className="bg-secondary/50 rounded-lg p-3 border border-border text-center">
          <p className="text-[10px] font-mono text-muted-foreground">EST. FABRIC</p>
          <p className="text-2xl font-bold text-foreground font-mono">{(pattern.estimatedFabricUsage / 10000).toFixed(2)}<span className="text-sm">m²</span></p>
        </div>
        <div className="bg-secondary/50 rounded-lg p-3 border border-border text-center">
          <p className="text-[10px] font-mono text-muted-foreground">SEAM ALLOW.</p>
          <p className="text-2xl font-bold text-foreground font-mono">{pattern.seamAllowance}<span className="text-sm">cm</span></p>
        </div>
      </div>
    </div>
  );
}
