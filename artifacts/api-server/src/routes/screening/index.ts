import { Router, type IRouter } from "express";
import { eq, desc, sql } from "drizzle-orm";
import { db, screeningSessions } from "@workspace/db";
import {
  CreateSessionBody,
  GetSessionParams,
  UpdateSessionParams,
  UpdateSessionBody,
  SubmitSessionParams,
  SubmitSessionBody,
  GenerateReportParams,
} from "@workspace/api-zod";
import { logger } from "../../lib/logger";

const router: IRouter = Router();

const MODULES = [
  { id: "academic", name: "Academic Stress", questions: ["ac1","ac2","ac3"], weights: [1.3,1.5,1.2] },
  { id: "anxiety", name: "Anxiety", questions: ["anx1","anx2","anx3"], weights: [1.5,1.4,1.3] },
  { id: "sleep", name: "Sleep Problems", questions: ["slp1","slp2","slp3"], weights: [1.2,1.3,1.1] },
  { id: "burnout", name: "Burnout", questions: ["brn1","brn2","brn3"], weights: [1.4,1.5,1.3] },
  { id: "depression", name: "Depression", questions: ["dep1","dep2","dep3"], weights: [1.6,1.5,1.4] },
  { id: "imposter", name: "Imposter Syndrome", questions: ["imp1","imp2","imp3"], weights: [1.3,1.2,1.4] },
  { id: "social", name: "Social Isolation", questions: ["soc1","soc2","soc3"], weights: [1.5,1.3,1.4] },
  { id: "selfesteem", name: "Low Self-Esteem", questions: ["se1","se2","se3"], weights: [1.4,1.3,1.2] },
  { id: "safety", name: "Safety", questions: ["safe1","safe2","safe3"], weights: [2.0,1.8,2.5] },
];

const MOOD_QUESTIONS = ["mood_netflix","mood_tabs","mood_tired","mood_figured_out","mood_future"];
const MOOD_WEIGHTS: Record<string,number> = { mood_netflix:1.0, mood_tabs:1.0, mood_tired:1.2, mood_figured_out:1.0, mood_future:1.0 };
const REVERSE_SCORED = new Set(["mood_future"]);

function computeResults(answers: {questionId: string; score: number}[]) {
  const answerMap = new Map(answers.map(a => [a.questionId, a.score]));

  let moodScore = 0;
  for (const qid of MOOD_QUESTIONS) {
    const raw = answerMap.get(qid) ?? 0;
    const score = REVERSE_SCORED.has(qid) ? (4 - raw) : raw;
    moodScore += score * MOOD_WEIGHTS[qid];
  }

  const moduleResults = [];
  let overallScore = 0;
  let overallMax = 0;
  let safetyAlert = false;
  const recommendations: string[] = [];

  for (const mod of MODULES) {
    if (mod.id === "safety") continue;
    const moduleScore = mod.questions.reduce((sum, qid, i) => {
      return sum + (answerMap.get(qid) ?? 0) * mod.weights[i];
    }, 0);
    const maxScore = mod.weights.reduce((s, w) => s + 4 * w, 0);
    const riskPercent = (moduleScore / maxScore) * 100;

    let riskLevel = "Chill";
    if (riskPercent >= 75) riskLevel = "High Risk";
    else if (riskPercent >= 50) riskLevel = "Needs Attention";
    else if (riskPercent >= 25) riskLevel = "Keep an Eye On It";

    overallScore += moduleScore;
    overallMax += maxScore;

    moduleResults.push({ name: mod.name, score: moduleScore, maxScore, riskPercent, riskLevel });

    if (riskPercent >= 50) {
      if (mod.id === "sleep") recommendations.push("Try a consistent sleep schedule and limit screens before bed.");
      if (mod.id === "anxiety") recommendations.push("Breathing exercises and grounding techniques can help with anxiety.");
      if (mod.id === "depression") recommendations.push("Consider speaking with a mental health professional or counselor.");
      if (mod.id === "burnout") recommendations.push("Rest is productive. Schedule recovery time intentionally.");
      if (mod.id === "academic") recommendations.push("Break large tasks into smaller chunks. Progress, not perfection.");
      if (mod.id === "imposter") recommendations.push("Your achievements are real. Keep a wins journal.");
      if (mod.id === "social") recommendations.push("Small connections matter. Try one genuine conversation this week.");
      if (mod.id === "selfesteem") recommendations.push("Challenge your inner critic. Would you say that to a friend?");
    }
  }

  const depressionMod = moduleResults.find(m => m.name === "Depression");
  if (depressionMod && depressionMod.score > 7) {
    safetyAlert = true;
    const safetyMod = MODULES.find(m => m.id === "safety")!;
    const safetyScore = safetyMod.questions.reduce((sum, qid, i) => {
      return sum + (answerMap.get(qid) ?? 0) * safetyMod.weights[i];
    }, 0);
    const safetyMax = safetyMod.weights.reduce((s, w) => s + 4 * w, 0);
    const safetyRisk = (safetyScore / safetyMax) * 100;
    let safetyLevel = "Chill";
    if (safetyRisk >= 75) safetyLevel = "High Risk";
    else if (safetyRisk >= 50) safetyLevel = "Needs Attention";
    else if (safetyRisk >= 25) safetyLevel = "Keep an Eye On It";
    moduleResults.push({ name: "Safety", score: safetyScore, maxScore: safetyMax, riskPercent: safetyRisk, riskLevel: safetyLevel });
    recommendations.push("Please reach out to a counselor or call the 988 Suicide & Crisis Lifeline.");
  }

  const overallRiskPercent = overallMax > 0 ? (overallScore / overallMax) * 100 : 0;
  let overallRisk = "Chill";
  if (overallRiskPercent >= 75) overallRisk = "High Risk";
  else if (overallRiskPercent >= 50) overallRisk = "Needs Attention";
  else if (overallRiskPercent >= 25) overallRisk = "Keep an Eye On It";

  if (recommendations.length === 0) {
    recommendations.push("You're doing okay! Keep checking in with yourself.");
  }

  return {
    overallRisk,
    overallScore: Math.round(overallRiskPercent),
    riskLevel: overallRisk,
    modules: moduleResults,
    safetyAlert,
    recommendations,
  };
}

router.post("/screening/sessions", async (req, res): Promise<void> => {
  const parsed = CreateSessionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [session] = await db.insert(screeningSessions).values({
    name: parsed.data.name,
    age: parsed.data.age ?? null,
    email: parsed.data.email ?? null,
    status: "in_progress",
  }).returning();
  res.status(201).json(session);
});

router.get("/screening/sessions", async (req, res): Promise<void> => {
  const sessions = await db.select().from(screeningSessions).orderBy(desc(screeningSessions.createdAt));
  res.json(sessions);
});

router.get("/screening/sessions/:id", async (req, res): Promise<void> => {
  const params = GetSessionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const [session] = await db.select().from(screeningSessions).where(eq(screeningSessions.id, id));
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }
  res.json(session);
});

router.patch("/screening/sessions/:id", async (req, res): Promise<void> => {
  const params = UpdateSessionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateSessionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const [session] = await db.update(screeningSessions)
    .set(parsed.data)
    .where(eq(screeningSessions.id, id))
    .returning();
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }
  res.json(session);
});

router.post("/screening/sessions/:id/submit", async (req, res): Promise<void> => {
  const params = SubmitSessionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = SubmitSessionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const results = computeResults(parsed.data.answers);

  const [session] = await db.update(screeningSessions)
    .set({
      status: "completed",
      results,
      completedAt: new Date(),
    })
    .where(eq(screeningSessions.id, id))
    .returning();

  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  res.json({ sessionId: id, ...results });
});

router.post("/screening/sessions/:id/report", async (req, res): Promise<void> => {
  const params = GenerateReportParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const [session] = await db.select().from(screeningSessions).where(eq(screeningSessions.id, id));
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  const reportId = `report-${id}-${Date.now()}`;
  req.log.info({ sessionId: id, reportId }, "Report generated");

  res.json({ message: "Report generated successfully", reportId });
});

router.get("/screening/stats", async (_req, res): Promise<void> => {
  const sessions = await db.select().from(screeningSessions).where(eq(screeningSessions.status, "completed"));

  const total = await db.select({ count: sql<number>`count(*)` }).from(screeningSessions);
  const totalCount = Number(total[0]?.count ?? 0);
  const completed = sessions.length;

  const byRiskLevel: Record<string, number> = { "Chill": 0, "Keep an Eye On It": 0, "Needs Attention": 0, "High Risk": 0 };
  const moduleCounts: Record<string, number> = {};
  let scoreSum = 0;

  for (const s of sessions) {
    const results = s.results as any;
    if (!results) continue;
    const rl = results.riskLevel ?? "Chill";
    byRiskLevel[rl] = (byRiskLevel[rl] ?? 0) + 1;
    scoreSum += results.overallScore ?? 0;
    for (const mod of (results.modules ?? [])) {
      if (mod.riskPercent >= 50) {
        moduleCounts[mod.name] = (moduleCounts[mod.name] ?? 0) + 1;
      }
    }
  }

  const topIssues = Object.entries(moduleCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  res.json({
    total: totalCount,
    completed,
    byRiskLevel,
    topIssues,
    averageScore: completed > 0 ? Math.round(scoreSum / completed) : 0,
  });
});

export default router;
