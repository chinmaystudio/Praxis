import { Request, Response, Router } from "express";
import { verifiedGoogleLeader } from "../services/db.service.js";
import { requestMemberCode, verifyMemberCode } from "../services/member-verification.service.js";
import { registerFreeTeam, createPaidTeamOrder, TeamDraft } from "../services/infinity.service.js";

const router = Router();
function token(req: Request) { return req.headers.authorization?.replace(/^Bearer\s+/i, "") || ""; }
async function leader(req: Request, email: string) {
  const id = await verifiedGoogleLeader(token(req), email);
  if (!id) throw new Error("Sign in with Google using the team leader email.");
  return id;
}
function respondError(res: Response, error: unknown) {
  const message = error instanceof Error ? error.message : "Request failed";
  const status = /Sign in/.test(message) ? 401 : 400;
  res.status(status).json({ success: false, error: message });
}

router.post("/otp/request", async (req, res) => {
  try {
    const { leaderEmail, email } = req.body;
    if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("A valid member email is required.");
    const id = await leader(req, leaderEmail);
    if (email.toLowerCase() === leaderEmail.toLowerCase()) throw new Error("The leader is verified through Google sign-in.");
    res.json({ success: true, challenge: await requestMemberCode(id, email) });
  } catch (error) { respondError(res, error); }
});

router.post("/otp/verify", async (req, res) => {
  try {
    const { leaderEmail, challengeId, code } = req.body;
    const id = await leader(req, leaderEmail);
    if (typeof code !== "string" || !/^\d{6}$/.test(code)) throw new Error("Enter the six-digit code.");
    res.json({ success: true, proof: await verifyMemberCode(id, challengeId, code) });
  } catch (error) { respondError(res, error); }
});

router.post("/free", async (req, res) => {
  try {
    const draft = req.body.draft as TeamDraft;
    const id = await leader(req, draft?.leaderEmail);
    res.json({ success: true, ...(await registerFreeTeam(draft, id, req.body.proofs || [])) });
  } catch (error) { respondError(res, error); }
});

router.post("/create-order", async (req, res) => {
  try {
    const draft = req.body.draft as TeamDraft;
    const id = await leader(req, draft?.leaderEmail);
    res.json({ success: true, ...(await createPaidTeamOrder(draft, id, req.body.proofs || [])) });
  } catch (error) { respondError(res, error); }
});

export default router;
