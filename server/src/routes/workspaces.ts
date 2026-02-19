import { Router, Response } from 'express';
import { z } from 'zod';
import Workspace from '../models/Workspace';
import Task from '../models/Task';
import authMiddleware, { AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

const createWorkspaceSchema = z.object({
  name: z.string().min(1, 'Name is required'),
});

// GET /api/workspaces - List user's workspaces
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const workspaces = await Workspace.find({
      $or: [{ owner: userId }, { members: userId }],
    }).sort({ createdAt: -1 });

    res.status(200).json(workspaces);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/workspaces - Create new workspace
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = createWorkspaceSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: 'Validation error', errors: parsed.error.flatten().fieldErrors });
      return;
    }

    const userId = req.user!.id;
    const { name } = parsed.data;

    const workspace = await Workspace.create({
      name,
      owner: userId,
      members: [userId], // Owner is implicitly a member
    });

    res.status(201).json(workspace);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// --- Reusable demo workspace creator ---
export async function createDemoWorkspaceForUser(userId: string) {
  const workspace = await Workspace.create({
    name: '🚀 Why You Should Hire Arnav',
    owner: userId,
    members: [userId],
  });

  const now = Date.now();
  const day = 86400000;

  const tasks = [
    // === TO DO (3) ===
    {
      title: "📄 Read Arnav's Resume (You Won't Regret It)",
      status: 'todo',
      description: "Full-stack dev, cloud-certified, hackathon winner, IIT Delhi Top-25. That's just page one. Grab coffee first — you'll need it to process all the achievements.",
      color: '#6366f1',
      position: 0,
      dueDate: new Date(now + day * 2),
    },
    {
      title: '🦜 Check Out His Voice Cloning Project',
      status: 'todo',
      description: "Built a real-time voice cloning system with FastAPI + Next.js + Qwen2-TTS 1.7B. Features SSE streaming, OpenAI Whisper transcription, and dynamic GPU memory management. Yes, he can make your computer talk like Morgan Freeman.",
      color: '#8b5cf6',
      position: 1,
      dueDate: new Date(now + day * 3),
    },
    {
      title: "🔍 Google 'Arnav Bule Hackathon Winner'",
      status: 'todo',
      description: "Won $1,000 at Horizon AI Hackathon hosted at University of Miami, USA. Spoiler: he didn't just participate — he dominated. 5x Google Arcade Winner too, because once wasn't enough.",
      color: '#a855f7',
      position: 2,
      dueDate: new Date(now + day * 4),
    },

    // === IN PROGRESS (3) ===
    {
      title: "✍️ Drafting the 'You're Hired' Email",
      status: 'in-progress',
      description: "Subject: Welcome to WLDD, Arnav! Body: We were impressed by your Node.js + TypeScript backend skills, React/Next.js frontend mastery, and the fact that you built an entire task tracker for your assignment. P.S. When can you start?",
      color: '#f59e0b',
      position: 0,
      dueDate: new Date(now + day),
    },
    {
      title: '🍕 Calculating Pizza for Welcome Party',
      status: 'in-progress',
      description: "Current formula: (team_size × 2.5 slices) + (arnav_excitement_level × 3). He led 55+ members in Cloud Computing Club and managed events for 600+ students, so he's used to feeding crowds. Budget: approved.",
      color: '#f97316',
      position: 1,
      dueDate: new Date(now + day * 2),
    },
    {
      title: '💎 Convincing HR This Candidate is a Steal',
      status: 'in-progress',
      description: "Evidence: Harness CI/CD certified, AWS & GCP Cloud Practitioner, Databricks Associate (Data Engineer AND Data Analyst), IBM Cybersecurity Specialization. All before graduating. The ROI on this hire is through the roof.",
      color: '#ef4444',
      position: 2,
      dueDate: new Date(now + day * 3),
    },

    // === IN REVIEW (3) ===
    {
      title: '✅ Evaluating Full-Stack Skills: Node, React, Next.js',
      status: 'in-review',
      description: "Backend: Node.js + TypeScript + Express + Zod validation + JWT auth ✓  Frontend: Next.js 15 + React 19 + Tailwind + shadcn/ui ✓  Database: MongoDB + Mongoose + Redis caching ✓  Real-time: WebSocket-ready architecture ✓  Verdict: This dev ships production-grade code.",
      color: '#10b981',
      position: 0,
      dueDate: new Date(now + day * 5),
    },
    {
      title: '🏆 Reviewing Cloud Certs & DevOps Chops',
      status: 'in-review',
      description: "Docker ✓ CI/CD (Harness + GitHub Actions) ✓ AWS (CodeBuild, CodeDeploy, CloudFormation) ✓ GCP ✓ Terraform ✓ Databricks (PySpark, Delta Lake, MLflow) ✓ He doesn't just write code — he deploys it, monitors it, and scales it.",
      color: '#14b8a6',
      position: 1,
      dueDate: new Date(now + day * 6),
    },
    {
      title: '🎓 Cross-Referencing IIT Delhi Top-25 Achievement',
      status: 'in-review',
      description: "Secured Top 25 nationwide in the College Youth Ideathon at IIT Delhi. Also: VP of Cloud Computing Club, Campus Ambassador at Viral Fission, Management Executive at Codechef MITADT. This guy doesn't just code — he LEADS.",
      color: '#06b6d4',
      position: 2,
      dueDate: new Date(now + day * 7),
    },

    // === COMPLETED (3) ===
    {
      title: '🔥 Built This Entire Task Tracker App',
      status: 'completed',
      description: "Full-stack Next.js 15 + Express + MongoDB + Redis app with JWT auth, email OTP verification, drag-and-drop Kanban boards, 4 task views (Board, List, Table, Timeline), workspace management, and 70%+ test coverage. For an assignment. Imagine what he'll build when hired.",
      color: '#22c55e',
      position: 0,
    },
    {
      title: '🏆 Won $1000 at Horizon AI Hackathon (Miami)',
      status: 'completed',
      description: "Flew to University of Miami, competed against international teams, and walked away with the prize. Skills demonstrated: rapid prototyping, AI/ML integration, teamwork under pressure, and the ability to function on 3 hours of sleep and energy drinks.",
      color: '#84cc16',
      position: 1,
    },
    {
      title: '🎯 Impressed WLDD with Assignment Submission',
      status: 'completed',
      description: "Requirements: Build a task tracker. Delivery: A production-grade, beautifully designed, fully tested full-stack app with OTP email verification, real-time features, glassmorphic UI, and this very workspace convincing you to hire him. Mission accomplished. 🫡",
      color: '#eab308',
      position: 2,
    },
  ];

  await Task.insertMany(
    tasks.map((t) => ({
      ...t,
      owner: userId,
      workspaceId: workspace._id,
    }))
  );

  return workspace;
}

// POST /api/workspaces/demo - Create demo workspace with sample tasks
router.post('/demo', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const workspace = await createDemoWorkspaceForUser(userId);
    res.status(201).json(workspace);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/workspaces/:id - Get single workspace (for title etc)
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const workspace = await Workspace.findOne({
      _id: req.params.id,
      $or: [{ owner: userId }, { members: userId }],
    });

    if (!workspace) {
      res.status(404).json({ message: 'Workspace not found' });
      return;
    }

    res.status(200).json(workspace);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/workspaces/:id - Update workspace
router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = createWorkspaceSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: 'Validation error', errors: parsed.error.flatten().fieldErrors });
      return;
    }

    const userId = req.user!.id;
    const workspace = await Workspace.findOne({
      _id: req.params.id,
      owner: userId, // Only owner can rename? Let's say yes for now.
    });

    if (!workspace) {
      res.status(404).json({ message: 'Workspace not found or not authorized' });
      return;
    }

    workspace.name = parsed.data.name;
    await workspace.save();

    res.status(200).json(workspace);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/workspaces/:id - Delete workspace and tasks
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const workspace = await Workspace.findOne({
      _id: req.params.id,
      owner: userId,
    });

    if (!workspace) {
      res.status(404).json({ message: 'Workspace not found or not authorized' });
      return;
    }

    // Delete workspace
    await workspace.deleteOne();

    // Delete all associated tasks
    await Task.deleteMany({ workspaceId: workspace._id });

    res.status(200).json({ message: 'Workspace deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
