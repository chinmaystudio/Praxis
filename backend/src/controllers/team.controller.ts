import { Request, Response, Router } from "express";
import { verifiedGoogleLeader } from "../services/db.service.js";
import { requestMemberCode, verifyMemberCode } from "../services/member-verification.service.js";
import { createTeamOrder, registerFreeTeam, TeamDraft } from "../services/team-registration.service.js";

const router = Router();
const token = (req: Request) => req.headers.authorization?.replace(/^Bearer\s+/i, "") || "";
async function leader(req: Request, email: string) {
  const id = await verifiedGoogleLeader(token(req), email);
  if (!id) throw new Error("Sign in with Google using the team leader email.");
  return id;
}
function fail(res: Response, error: unknown) {
  const message = error instanceof Error ? error.message : "Request failed";
  res.status(/Sign in/.test(message) ? 401 : 400).json({ success: false, error: message });
}

router.post("/otp/request", async (req, res) => {
  try {
    const { leaderEmail, email } = req.body;
    if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("A valid member email is required.");
    const id = await leader(req, leaderEmail);
    if (email.toLowerCase() === leaderEmail.toLowerCase()) throw new Error("The leader is verified through Google sign-in.");
    res.json({ success: true, challenge: await requestMemberCode(id, email) });
  } catch (error) { fail(res, error); }
});
router.post("/otp/verify", async (req, res) => {
  try {
    const id = await leader(req, req.body.leaderEmail);
    if (typeof req.body.code !== "string" || !/^\d{6}$/.test(req.body.code)) throw new Error("Enter the six-digit code.");
    res.json({ success: true, proof: await verifyMemberCode(id, req.body.challengeId, req.body.code) });
  } catch (error) { fail(res, error); }
});
router.post("/free", async (req, res) => {
  try {
    const draft = req.body.draft as TeamDraft;
    res.json({ success: true, ...(await registerFreeTeam(draft, await leader(req, draft?.leaderEmail), req.body.proofs || [])) });
  } catch (error) { fail(res, error); }
});
router.post("/create-order", async (req, res) => {
  try {
    const draft = req.body.draft as TeamDraft;
    res.json({ success: true, ...(await createTeamOrder(draft, await leader(req, draft?.leaderEmail), req.body.proofs || [])) });
  } catch (error) { fail(res, error); }
});

export default router;
