import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Scissors, Ruler, Layers, Zap } from 'lucide-react';

export default function Index() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background blueprint-grid relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
              <Scissors size={16} className="text-primary-foreground" />
            </div>
            <span className="font-mono text-sm font-bold tracking-wider text-foreground">DSG WEAR</span>
          </div>
          <Button onClick={() => navigate('/create')} size="sm" className="gap-2">
            New Pattern <ArrowRight size={14} />
          </Button>
        </div>
      </header>

      {/* Hero */}
      <main className="relative z-10 max-w-6xl mx-auto px-6">
        <section className="py-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <p className="text-xs font-mono text-primary tracking-[0.3em] mb-4">FABRIC-AWARE GARMENT CAD</p>
            <h1 className="text-4xl md:text-6xl font-bold text-foreground leading-tight mb-6">
              Pattern Generation
              <br />
              <span className="text-glow text-primary">Meets Textile Science</span>
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed">
              Create production-ready garment patterns that adapt to fabric mechanics. 
              Input measurements, select your textile, and let the engine handle the physics.
            </p>
            <div className="flex gap-4 justify-center">
              <Button size="lg" onClick={() => navigate('/create')} className="gap-2 text-base px-8">
                Start Drafting <ArrowRight size={18} />
              </Button>
              <Button size="lg" variant="outline" className="gap-2 text-base px-8 border-border">
                Learn More
              </Button>
            </div>
          </motion.div>
        </section>

        {/* Features */}
        <section className="py-16 grid md:grid-cols-3 gap-6">
          {[
            {
              icon: Ruler,
              title: 'Measurement-Based Drafting',
              desc: 'Enter body measurements, get accurate base slopers with proper ease allowances.',
            },
            {
              icon: Layers,
              title: 'Fabric Intelligence',
              desc: 'Elasticity, drape, and tensile strength directly modify your pattern geometry.',
            },
            {
              icon: Zap,
              title: 'Instant Generation',
              desc: 'From inputs to production-ready patterns in under 5 seconds. Export as PDF, DXF, or SVG.',
            },
          ].map((feat, i) => (
            <motion.div
              key={feat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.15 }}
              className="bg-card border border-border rounded-lg p-6 hover:border-primary/30 transition-colors glow-cyan"
            >
              <feat.icon size={24} className="text-primary mb-4" />
              <h3 className="font-semibold text-foreground mb-2">{feat.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feat.desc}</p>
            </motion.div>
          ))}
        </section>

        {/* Stats */}
        <section className="py-16 border-t border-border">
          <div className="grid grid-cols-4 gap-6 text-center">
            {[
              { value: '70%', label: 'Faster Drafting' },
              { value: '60%', label: 'Fewer Errors' },
              { value: '8+', label: 'Fabric Presets' },
              { value: '<5s', label: 'Generation Time' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 + i * 0.1 }}
              >
                <p className="text-3xl font-bold font-mono text-primary text-glow">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1 font-mono">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border py-6">
        <p className="text-center text-xs text-muted-foreground font-mono">
          DSG WEAR — Fabric-Aware Garment Pattern Platform | Made by Hamza for 🥚 
        </p>
      </footer>
    </div>
  );
}
