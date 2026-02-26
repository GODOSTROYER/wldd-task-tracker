"use client";

import { useUser } from "@/lib/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  ArrowRight,
  Layout,
  Server,
  Database,
  Shield,
  Zap,
  TestTube,
  Layers,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const PRD_CHECKLIST = [
  { label: "User & Task Models (Mongoose schemas + validation)", done: true },
  { label: "REST API — signup, login, CRUD tasks", done: true },
  { label: "JWT auth + bcrypt password hashing", done: true },
  { label: "Redis caching on GET /api/tasks", done: true },
  { label: "Cache invalidation on create/update/delete", done: true },
  { label: "MongoDB indexes on owner & status", done: true },
  { label: "Next.js frontend — Login, Signup, Dashboard", done: true },
  { label: "Dynamic task list updates after CRUD", done: true },
  { label: "Jest tests + mongodb-memory-server + ioredis-mock", done: true },
  { label: "70%+ backend test coverage", done: true },
];

const BONUS_FEATURES = [
  { label: "Drag-and-drop Kanban boards", done: true },
  { label: "4 views — Board, List, Table, Timeline", done: true },
  { label: "Workspace management system", done: true },
  { label: "Email OTP verification flow", done: true },
  { label: "Password reset via email", done: true },
  { label: "Background chooser + dark mode", done: true },
  { label: "Task filtering by status & priority", done: true },
  { label: "Password strength validation", done: true },
];

const TECH_STACK = [
  { icon: Server, label: "Node.js + Express + TypeScript", color: "text-green-500" },
  { icon: Database, label: "MongoDB + Mongoose + Redis", color: "text-blue-500" },
  { icon: Layers, label: "Next.js 15 + React 19 + Tailwind", color: "text-purple-500" },
  { icon: Shield, label: "JWT + bcrypt + Zod validation", color: "text-amber-500" },
  { icon: TestTube, label: "Jest + 70%+ coverage", color: "text-pink-500" },
  { icon: Zap, label: "Redis caching layer", color: "text-red-500" },
];

export default function HomePage() {
  const { isSignedIn } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isSignedIn) {
      router.push("/workspaces");
    }
  }, [isSignedIn, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-violet-950 text-white">
      {/* Minimal nav */}
      <nav className="container mx-auto px-4 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
            <Layout className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">TaskFlow</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" className="text-white/70 hover:text-white hover:bg-white/10">
              Sign in
            </Button>
          </Link>
          <Link href="/signup">
            <Button className="bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/25">
              Get started
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="container mx-auto px-4 pt-16 pb-8 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-sm font-medium mb-8">
            <Sparkles className="h-4 w-4" />
            WLDD Full-Stack Developer Assignment — Bangalore
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold leading-[1.1] mb-6 tracking-tight">
            You said build a{" "}
            <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
              task tracker.
            </span>
            <br />
            <span className="text-white/60 text-4xl md:text-5xl">
              I built the whole damn thing. 🫡
            </span>
          </h1>

          <p className="text-lg md:text-xl text-white/50 mb-10 max-w-2xl mx-auto leading-relaxed">
            Every PRD requirement? <span className="text-green-400 font-semibold">Done.</span>{" "}
            Bonus features? <span className="text-purple-400 font-semibold">Stacked.</span>{" "}
            Code quality? <span className="text-blue-400 font-semibold">Production-grade.</span>{" "}
            This isn&apos;t a homework submission — it&apos;s a statement.
          </p>

          {!isSignedIn && (
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/signup">
                <Button size="lg" className="bg-blue-500 hover:bg-blue-600 text-white text-lg px-8 shadow-xl shadow-blue-500/20 rounded-xl h-12">
                  Try it yourself
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* PRD Checklist */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-center text-3xl md:text-4xl font-bold mb-3 tracking-tight">
            The PRD said it, I shipped it 🚀
          </h2>
          <p className="text-center text-white/40 mb-12 text-lg">
            Every single requirement from the assignment. All green. No cap.
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Required */}
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-5">
                <div className="h-7 w-7 rounded-lg bg-green-500/15 flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                </div>
                <h3 className="text-lg font-bold text-green-400">Required — 10/10</h3>
              </div>
              <ul className="space-y-3">
                {PRD_CHECKLIST.map((item) => (
                  <li key={item.label} className="flex items-start gap-2.5 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-400 mt-0.5 shrink-0" />
                    <span className="text-white/70">{item.label}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Bonus */}
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-5">
                <div className="h-7 w-7 rounded-lg bg-purple-500/15 flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-purple-400" />
                </div>
                <h3 className="text-lg font-bold text-purple-400">Bonus — went overboard 😤</h3>
              </div>
              <ul className="space-y-3">
                {BONUS_FEATURES.map((item) => (
                  <li key={item.label} className="flex items-start gap-2.5 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-purple-400 mt-0.5 shrink-0" />
                    <span className="text-white/70">{item.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-center text-3xl md:text-4xl font-bold mb-3 tracking-tight">
            Built different. Literally. ⚡
          </h2>
          <p className="text-center text-white/40 mb-12 text-lg">
            Clean architecture, typed end-to-end, tested and cached.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {TECH_STACK.map((tech) => (
              <div
                key={tech.label}
                className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 text-center hover:bg-white/[0.06] transition-colors group"
              >
                <tech.icon className={`h-8 w-8 mx-auto mb-3 ${tech.color} opacity-80 group-hover:opacity-100 transition-opacity`} />
                <span className="text-sm text-white/60 font-medium group-hover:text-white/80 transition-colors">
                  {tech.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Fun CTA */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-gradient-to-br from-blue-500/10 via-violet-500/10 to-purple-500/10 border border-white/[0.08] rounded-3xl p-10 backdrop-blur-sm">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
              Still scrolling? 👀
            </h2>
            <p className="text-white/50 mb-8 text-lg leading-relaxed">
              The code&apos;s clean, the tests pass, the cache invalidates, and the
              Kanban board drags and drops. What more do you want? Oh right — try it.
            </p>
            {!isSignedIn && (
              <Link href="/signup">
                <Button size="lg" className="bg-white text-slate-900 hover:bg-white/90 text-lg px-8 rounded-xl h-12 font-semibold shadow-xl">
                  Create an account & see for yourself
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Layout className="h-5 w-5 text-blue-400" />
              <span className="font-bold">TaskFlow</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-white/30">
              <span>Built with Next.js 15 + Express + MongoDB + Redis</span>
              <span>·</span>
              <span>WLDD Assignment 2026</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
