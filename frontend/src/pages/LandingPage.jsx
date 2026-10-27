import React from 'react';
import { Link } from 'react-router-dom';
import {
  Layers,
  ArrowRight,
  GitPullRequest,
  ShieldAlert,
  TestTube2,
  FileCode2,
  CheckCircle2,
  Sparkles,
  Network,
  Cpu,
  Github,
  MessageSquareCode,
  Brain,
} from 'lucide-react';
import Button from '../components/common/Button';

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-brand-500 selection:text-white">
      {/* Navigation */}
      <header className="h-16 border-b border-slate-800/80 px-6 sm:px-12 flex items-center justify-between bg-slate-950/80 backdrop-blur-md sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-indigo-700 flex items-center justify-center text-white shadow-glow-brand">
            <Layers className="w-4.5 h-4.5" />
          </div>
          <span className="font-bold text-base tracking-tight text-white">
            RepoMemory <span className="text-brand-400">Impact</span>
          </span>
        </div>

        <nav className="flex items-center gap-3 sm:gap-4">
          <Link
            to="/analysis/analysis_101"
            className="text-xs text-slate-300 hover:text-white transition-colors hidden sm:block"
          >
            Live Demo
          </Link>
          <Link to="/login">
            <Button variant="ghost" size="sm">
              Sign In
            </Button>
          </Link>
          <Link to="/register">
            <Button variant="primary" size="sm">
              Get Started
            </Button>
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative px-6 py-20 sm:py-28 max-w-6xl mx-auto text-center overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-brand-500/10 blur-[120px] -z-10 pointer-events-none rounded-full" />

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300 font-mono mb-6">
          <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
          <span>AST-Driven Pull Request Impact Engine</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight">
          Know What Your Code Changes <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-indigo-300">Could Break.</span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          RepoMemory parses your repository dependency graph to visualize affected modules, trace downstream call hierarchies, and recommend targeted test suites before you merge.
        </p>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
          <Link to="/register">
            <Button size="lg" variant="primary" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Analyze a Pull Request
            </Button>
          </Link>
          <Link to="/analysis/analysis_101">
            <Button size="lg" variant="secondary" leftIcon={<Sparkles className="w-4 h-4 text-amber-400" />}>
              Explore Demo (PR #142)
            </Button>
          </Link>
        </div>

        {/* Interactive Hero Graph Preview Card */}
        <div className="mt-14 p-2 sm:p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 shadow-2xl backdrop-blur-sm text-left">
          <div className="px-4 py-2.5 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400 mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="ml-2 text-slate-300">sample-pr-analysis // student-management-system #142</span>
            </div>
            <span className="text-red-400 font-semibold">HIGH RISK DETECTED</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-2">
            <div className="p-4 rounded-xl bg-slate-950 border border-brand-500/50 shadow-glow-brand">
              <div className="text-[10px] font-mono text-brand-400 uppercase font-semibold">Changed in PR</div>
              <div className="font-semibold text-sm text-white mt-1">gradeCalculator.js</div>
              <div className="text-xs text-slate-400 mt-1 font-mono">calculateFinalGrade signature refactored</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/50 shadow-glow-amber">
              <div className="text-[10px] font-mono text-amber-400 uppercase font-semibold">Potentially Affected</div>
              <div className="font-semibold text-sm text-white mt-1">graduationRoutes.js</div>
              <div className="text-xs text-slate-400 mt-1 font-mono">Passing obsolete positional arguments</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-cyan-500/50">
              <div className="text-[10px] font-mono text-cyan-400 uppercase font-semibold">Recommended Test</div>
              <div className="font-semibold text-sm text-white mt-1">tests/unit/gradeCalculator.test.js</div>
              <div className="text-xs text-slate-400 mt-1 font-mono">Direct unit test verification required</div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="px-6 py-16 bg-slate-900/50 border-t border-slate-800/80">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              The 4 Pillars of RepoMemory
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Understand how code connects, what a pull request might break, and why the architecture works the way it does.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
              <div className="w-10 h-10 rounded-lg bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center mb-4 shadow-glow-brand">
                <Network className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-sm text-slate-100">1. Visual Codebase Map</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Interactive React Flow mind map connecting files, routes, controllers, Mongoose schemas, and test suites.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4 shadow-glow-amber">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-sm text-slate-100">2. Change Impact Analysis</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Identify downstream affected files, blast radius, and execute targeted test commands before merging a PR.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
                <MessageSquareCode className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-sm text-slate-100">3. Repository Q&A</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Ask questions like "Where is auth handled?" and receive explanations backed by verified AST code citations.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-4">
                <Brain className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-sm text-slate-100">4. Project Memory</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Preserve architectural decisions (ADRs), technical trade-offs, and design rationale so project context is never lost.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="px-6 py-16 border-t border-slate-800/80">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-white mb-10">
            How RepoMemory Works in Your PR Workflow
          </h2>

          <div className="space-y-4">
            {[
              {
                step: '01',
                title: 'Connect GitHub Repository',
                desc: 'Select or reference any JavaScript or TypeScript repository from your workspace.',
              },
              {
                step: '02',
                title: 'Open Pull Request Analysis',
                desc: 'Compare feature branch against main to compute changed file AST signatures.',
              },
              {
                step: '03',
                title: 'Explore the Dependency Graph',
                desc: 'Inspect changed nodes (indigo) and downstream affected modules (amber) with zoom and pan.',
              },
              {
                step: '04',
                title: 'Execute Targeted Tests',
                desc: 'Copy verified test commands directly into your CLI to ensure zero regressions before merging.',
              },
            ].map((item) => (
              <div
                key={item.step}
                className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-lg bg-slate-800 font-mono text-sm font-bold text-brand-400 flex items-center justify-center shrink-0 border border-slate-700">
                  {item.step}
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-slate-100">{item.title}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 py-8 px-6 text-center text-xs text-slate-400">
        <div className="flex items-center justify-center gap-2 mb-2 font-mono">
          <Layers className="w-4 h-4 text-brand-400" />
          <span className="font-semibold text-slate-300">RepoMemory Impact</span>
          <span>•</span>
          <span>Developer Pull Request Change Impact Analysis Platform</span>
        </div>
        <p className="text-[11px] text-slate-400">
          Frontend client ready for Node.js / Express backend integration.
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;
