import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useWorkflow } from '@/contexts/WorkflowContext';
import { generatePattern, PatternPiece } from '@/lib/patternEngine';

function PatternPieceSVG({ piece, offsetX, offsetY }: { piece: PatternPiece; offsetX: number; offsetY: number }) {
  const pathData = piece.points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x + offsetX} ${p.y + offsetY}`)
    .join(' ') + ' Z';

  return (
    <g>
      {/* Pattern piece fill */}
      <path
        d={pathData}
        fill="hsl(186 100% 50% / 0.05)"
        stroke="hsl(186 100% 50% / 0.7)"
        strokeWidth="1.5"
        className="animate-draw-line"
        strokeDasharray="1000"
      />

      {/* Grain line */}
      {piece.grainLine && (
        <line
          x1={piece.grainLine.start.x + offsetX}
          y1={piece.grainLine.start.y + offsetY}
          x2={piece.grainLine.end.x + offsetX}
          y2={piece.grainLine.end.y + offsetY}
          stroke="hsl(186 60% 30% / 0.5)"
          strokeWidth="1"
          strokeDasharray="4 4"
        />
      )}

      {/* Label */}
      <text
        x={piece.points.reduce((s, p) => s + p.x, 0) / piece.points.length + offsetX}
        y={piece.points.reduce((s, p) => s + p.y, 0) / piece.points.length + offsetY}
        textAnchor="middle"
        fill="hsl(186 100% 50% / 0.6)"
        fontSize="10"
        fontFamily="JetBrains Mono, monospace"
      >
        {piece.name}
      </text>

      {/* Annotations */}
      {piece.annotations.map((ann, i) => (
        <text
          key={i}
          x={ann.position.x + offsetX}
          y={ann.position.y + offsetY}
          textAnchor="middle"
          fill="hsl(210 40% 85% / 0.7)"
          fontSize="8"
          fontFamily="JetBrains Mono, monospace"
        >
          {ann.label}: {ann.value}
        </text>
      ))}
    </g>
  );
}

export default function PatternPreviewStep() {
  const { state } = useWorkflow();

  const pattern = useMemo(() => {
    if (!state.garmentType) return null;
    return generatePattern(state.measurements, state.fabric, state.garmentType);
  }, [state.measurements, state.fabric, state.garmentType]);

  if (!pattern) return <p className="text-muted-foreground">Select a garment type first</p>;

  // Calculate layout offsets
  const offsets = pattern.pieces.map((_, i) => ({
    x: 40 + (i % 3) * 260,
    y: 60 + Math.floor(i / 3) * 280,
  }));

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Generated Pattern</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {pattern.pieces.length} pieces generated for {state.garmentType} using {state.fabric.name}
        </p>
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

      {/* SVG Pattern View */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-card rounded-lg border border-border overflow-hidden blueprint-grid"
      >
        <svg
          viewBox="0 0 800 500"
          className="w-full h-auto"
          style={{ minHeight: 400 }}
        >
          {/* Grid origin marker */}
          <circle cx="20" cy="20" r="3" fill="hsl(186 100% 50% / 0.3)" />
          <text x="28" y="24" fill="hsl(186 100% 50% / 0.3)" fontSize="8" fontFamily="JetBrains Mono">0,0</text>

          {pattern.pieces.map((piece, i) => (
            <PatternPieceSVG
              key={piece.id}
              piece={piece}
              offsetX={offsets[i].x}
              offsetY={offsets[i].y}
            />
          ))}
        </svg>
      </motion.div>

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
          <p className="text-2xl font-bold text-foreground font-mono">{state.fabric.thickness > 0.6 ? '2.0' : state.fabric.tensileStrength < 40 ? '1.8' : '1.5'}<span className="text-sm">cm</span></p>
        </div>
      </div>
    </div>
  );
}
