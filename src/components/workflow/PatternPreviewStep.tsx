import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useWorkflow } from '@/contexts/WorkflowContext';
import { generatePattern, PatternPiece } from '@/lib/patternEngine';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { GARMENT_IMAGES } from '@/assets/garments';

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
      {showSeam && piece.seamAllowancePath && (
        <path d={piece.seamAllowancePath} fill="none" stroke="hsl(38 92% 50% / 0.3)" strokeWidth="0.8" strokeDasharray="4 2" />
      )}
      <path d={piece.pathCommands} fill="hsl(186 100% 50% / 0.04)" stroke="hsl(186 100% 50% / 0.8)" strokeWidth="1.5" />
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
      {piece.notches.map((n, i) => (
        <NotchSVG key={i} x={n.position.x} y={n.position.y} type={n.type} />
      ))}
      {showAnnotations && piece.annotations.map((a, i) => (
        <text
          key={i} x={a.position.x} y={a.position.y} textAnchor="middle"
          fill="hsl(210 40% 85% / 0.6)" fontSize="7.5" fontFamily="JetBrains Mono"
          transform={a.angle ? `rotate(${a.angle},${a.position.x},${a.position.y})` : undefined}
        >
          {a.label}: {a.value}
        </text>
      ))}
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

      {/* Finished Garment Preview with actual image */}
      {state.garmentType && (
        <div className="space-y-2">
          <h4 className="text-[10px] font-mono font-semibold text-primary">FINISHED GARMENT PREVIEW</h4>
          <div className="bg-card rounded-lg border border-border p-4 flex items-center justify-center">
            <img
              src={GARMENT_IMAGES[state.garmentType]}
              alt={`${state.garmentType} preview`}
              className="max-h-[300px] object-contain"
            />
          </div>
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
