import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const dataFile = path.join(rootDir, 'data', 'finefatigue-store.json');
const app = express();
const activeSessions = new Map();
app.disable('x-powered-by');
app.use(express.json({ limit: '2mb' }));

function isLegacySampleRecord(item) {
  return String(item?.id || '').startsWith('DEMO-SUBJ-');
}
function isLegacySampleAccount(accountId, account) {
  const profile = account?.user;
  return (accountId === 'USR-SUBJ-001' && profile?.name === '张受试 (Participant 01)') ||
    (accountId === 'USR-SUBJ-002' && profile?.name === '王同学 (Student Trial)');
}
function readStore() {
  try {
    const parsed = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    const accounts = parsed.accounts && typeof parsed.accounts === 'object' ? parsed.accounts : {};
    for (const [accountId, account] of Object.entries(accounts)) {
      if (isLegacySampleAccount(accountId, account)) {
        delete accounts[accountId];
        continue;
      }
      account.sessions = Array.isArray(account.sessions) ? account.sessions.filter(session => !isLegacySampleRecord(session)) : [];
      account.subjective = Array.isArray(account.subjective) ? account.subjective : [];
      account.settings = account.settings && typeof account.settings === 'object' ? account.settings : {};
      account.compensation = account.compensation && typeof account.compensation === 'object' ? account.compensation : { amount: 0, note: '', status: 'pending' };
      account.status = ['active', 'pending', 'disabled'].includes(account.status) ? account.status : 'active';
    }
    return { accounts };
  } catch {
    return { accounts: {} };
  }
}
let store = readStore();
function writeStore() {
  fs.mkdirSync(path.dirname(dataFile), { recursive: true });
  const temporaryFile = `${dataFile}.tmp`;
  fs.writeFileSync(temporaryFile, JSON.stringify(store, null, 2), 'utf8');
  fs.renameSync(temporaryFile, dataFile);
}
writeStore();

function canonicalKey(value) {
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 64);
}
function publicUser(user) {
  const { loginKey, ...profile } = user;
  return profile;
}
function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  return { salt, hash: crypto.scryptSync(password, salt, 64).toString('hex') };
}
function verifyPassword(password, passwordRecord) {
  if (!passwordRecord?.salt || !passwordRecord?.hash) return false;
  const candidate = crypto.scryptSync(password, passwordRecord.salt, 64);
  const saved = Buffer.from(passwordRecord.hash, 'hex');
  return saved.length === candidate.length && crypto.timingSafeEqual(saved, candidate);
}
function createParticipantAccount(identifier, password) {
  const loginKey = canonicalKey(identifier);
  if (!loginKey || typeof password !== 'string' || password.length < 8) return null;
  const accountId = `USR-${crypto.createHash('sha256').update(loginKey).digest('hex').slice(0, 12).toUpperCase()}`;
  const participantCode = String(identifier).trim().slice(0, 64).toUpperCase();
  const account = {
    user: { id: accountId, name: participantCode, email: `${loginKey}@lab.local`, role: 'participant', participantCode, avatar: '🧑‍🔬', lastLogin: Date.now(), loginKey },
    password: hashPassword(password),
    sessions: [], subjective: [], settings: {},
    compensation: { amount: 0, note: '', status: 'pending' }, status: 'pending', createdAt: Date.now(), updatedAt: Date.now()
  };
  store.accounts[accountId] = account;
  return account;
}
function findAccount(identifier) {
  const loginKey = canonicalKey(identifier);
  return Object.values(store.accounts).find(account => account?.user?.loginKey === loginKey) || null;
}
function issueSession(accountId, role) {
  const token = crypto.randomBytes(32).toString('base64url');
  activeSessions.set(token, { accountId, role, expiresAt: Date.now() + 1000 * 60 * 60 * 12 });
  return token;
}
function readSession(req) {
  const header = String(req.headers.authorization || '');
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const session = activeSessions.get(token);
  if (!session || session.expiresAt < Date.now()) {
    if (token) activeSessions.delete(token);
    return null;
  }
  return { token, ...session };
}
function requireParticipant(req, res, next) {
  const session = readSession(req);
  const account = session?.role === 'participant' ? store.accounts[session.accountId] : null;
  if (!account || account.status === 'disabled') return res.status(401).json({ error: 'A valid participant session is required.' });
  req.account = account;
  next();
}
function requireAdmin(req, res, next) {
  const session = readSession(req);
  if (!session || session.role !== 'researcher') return res.status(403).json({ error: 'Administrator access is required.' });
  next();
}
function mergeById(existing = [], incoming = []) {
  const merged = new Map();
  for (const item of [...existing, ...incoming]) {
    if (isLegacySampleRecord(item) || !item?.id) continue;
    const current = merged.get(item.id);
    if (!current || Number(item.timestamp || 0) >= Number(current.timestamp || 0)) merged.set(item.id, { ...item });
  }
  return [...merged.values()].sort((a, b) => Number(b.timestamp || 0) - Number(a.timestamp || 0));
}
function accountPayload(account) {
  return { user: publicUser(account.user), sessions: account.sessions, subjective: account.subjective, settings: account.settings, syncedAt: account.updatedAt };
}
function adminProfile() {
  return { id: 'ADMIN', name: process.env.ADMIN_USERNAME || 'Administrator', email: 'admin@lab.local', role: 'researcher', participantCode: 'ADMIN', avatar: '🧑‍💼', lastLogin: Date.now() };
}
function csvEscape(value) {
  const text = value === undefined || value === null ? '' : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}
function csvResponse(res, filename, columns, rows) {
  const header = columns.join(',');
  const lines = rows.map(row => Object.values(row).map(csvEscape).join(','));
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(`\uFEFF${header}${lines.length ? `\n${lines.join('\n')}` : ''}`);
}

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'FineFatigue LAN server' }));
app.post('/api/auth/login', (req, res) => {
  const { identifier, password, mode = 'login' } = req.body || {};
  if (typeof password !== 'string') return res.status(400).json({ error: 'Password is required.' });
  if ((!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD) && mode === 'login' && String(identifier || '').toLowerCase().includes('admin')) {
    return res.status(503).json({ error: 'Administrator login has not been configured on this server.' });
  }
  if (process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD && identifier === process.env.ADMIN_USERNAME) {
    const supplied = Buffer.from(password);
    const expected = Buffer.from(process.env.ADMIN_PASSWORD);
    if (supplied.length !== expected.length || !crypto.timingSafeEqual(supplied, expected)) return res.status(401).json({ error: 'Invalid username or password.' });
    const user = adminProfile();
    return res.json({ user, token: issueSession(user.id, 'researcher') });
  }
  let account = findAccount(identifier);
  const wasRegistered = !account && mode === 'register';
  if (wasRegistered) account = createParticipantAccount(identifier, password);
  if (!account) return res.status(401).json({ error: mode === 'register' ? 'Registration failed. Use a unique identifier and at least 8 characters for the password.' : 'Account not found or password is incorrect.' });
  if (wasRegistered) {
    writeStore();
    return res.status(202).json({ pending: true, message: 'Registration received. An administrator must approve this participant before sign-in.' });
  }
  if (account.status !== 'active') return res.status(403).json({ error: account.status === 'pending' ? 'This registration is awaiting administrator approval.' : 'This account has been disabled by the study administrator.' });
  if (!verifyPassword(password, account.password)) return res.status(401).json({ error: 'Account not found or password is incorrect.' });
  account.user.lastLogin = Date.now();
  account.updatedAt = Date.now();
  writeStore();
  res.json({ user: publicUser(account.user), token: issueSession(account.user.id, 'participant') });
});
app.get('/api/auth/me', (req, res) => {
  const session = readSession(req);
  if (!session) return res.status(401).json({ error: 'Session expired.' });
  if (session.role === 'researcher') return res.json({ user: adminProfile() });
  const account = store.accounts[session.accountId];
  if (!account || account.status === 'disabled') return res.status(401).json({ error: 'Session expired.' });
  return res.json({ user: publicUser(account.user) });
});
app.post('/api/auth/logout', (req, res) => {
  const session = readSession(req);
  if (session) activeSessions.delete(session.token);
  res.status(204).end();
});
app.post('/api/sync', requireParticipant, (req, res) => {
  const { sessions, subjective, settings } = req.body || {};
  const account = req.account;
  account.sessions = mergeById(account.sessions, Array.isArray(sessions) ? sessions : []);
  account.subjective = mergeById(account.subjective, Array.isArray(subjective) ? subjective : []);
  account.settings = { ...account.settings, ...(settings && typeof settings === 'object' ? settings : {}) };
  account.updatedAt = Date.now();
  writeStore();
  res.json(accountPayload(account));
});
app.get('/api/admin/accounts', requireAdmin, (_req, res) => {
  const accounts = Object.values(store.accounts).map(account => ({
    id: account.user.id, name: account.user.name, participantCode: account.user.participantCode, createdAt: account.createdAt,
    lastLogin: account.user.lastLogin, status: account.status, experimentCount: account.sessions.length,
    subjectiveCount: account.subjective.length, compensation: account.compensation
  })).sort((a, b) => Number(b.lastLogin || 0) - Number(a.lastLogin || 0));
  res.json({ accounts });
});
app.patch('/api/admin/accounts/:id', requireAdmin, (req, res) => {
  const account = store.accounts[req.params.id];
  if (!account) return res.status(404).json({ error: 'Participant account not found.' });
  const { status, compensationAmount, compensationNote, compensationStatus, resetPassword } = req.body || {};
  if (['active', 'pending', 'disabled'].includes(status)) account.status = status;
  if (Number.isFinite(Number(compensationAmount)) && Number(compensationAmount) >= 0) account.compensation.amount = Number(compensationAmount);
  if (typeof compensationNote === 'string') account.compensation.note = compensationNote.slice(0, 500);
  if (['pending', 'approved', 'paid'].includes(compensationStatus)) account.compensation.status = compensationStatus;
  if (typeof resetPassword === 'string' && resetPassword.length >= 8) account.password = hashPassword(resetPassword);
  account.updatedAt = Date.now();
  writeStore();
  res.json({ ok: true });
});
app.get('/api/admin/export/sessions.csv', requireAdmin, (_req, res) => {
  const rows = Object.values(store.accounts).flatMap(account => account.sessions.map(session => ({
    participant_code: account.user.participantCode, session_id: session.id, timestamp: session.timestamp,
    fatigue_index: session.fatigueIndex, fatigue_level: session.fatigueLevel, challenge_duration_sec: session.challengeDurationSec, challenge_taps: session.challengeTaps,
    baseline_stability_score: session.baseline?.stability?.stabilityScore, post_stability_score: session.postFatigue?.stability?.stabilityScore,
    baseline_motion_rms_g: session.baseline?.stability?.motionRMS, post_motion_rms_g: session.postFatigue?.stability?.motionRMS,
    baseline_tap_rate_hz: session.baseline?.tapping?.tapRate, post_tap_rate_hz: session.postFatigue?.tapping?.tapRate,
    baseline_reaction_median_ms: session.baseline?.reaction?.medianReactionMs, post_reaction_median_ms: session.postFatigue?.reaction?.medianReactionMs,
    baseline_tracing_rmse_px: session.baseline?.tracing?.pathRMSE, post_tracing_rmse_px: session.postFatigue?.tracing?.pathRMSE,
    subjective_rating: session.subjectiveFatigue?.rating, subjective_level: session.subjectiveFatigue?.level,
    subjective_sensations: (session.subjectiveFatigue?.sensations || []).join('|'), subjective_note: session.subjectiveFatigue?.note
  })));
  csvResponse(res, 'finefatigue-sessions.csv', ['participant_code', 'session_id', 'timestamp', 'fatigue_index', 'fatigue_level', 'challenge_duration_sec', 'challenge_taps', 'baseline_stability_score', 'post_stability_score', 'baseline_motion_rms_g', 'post_motion_rms_g', 'baseline_tap_rate_hz', 'post_tap_rate_hz', 'baseline_reaction_median_ms', 'post_reaction_median_ms', 'baseline_tracing_rmse_px', 'post_tracing_rmse_px', 'subjective_rating', 'subjective_level', 'subjective_sensations', 'subjective_note'], rows);
});
app.get('/api/admin/export/users.csv', requireAdmin, (_req, res) => {
  const rows = Object.values(store.accounts).map(account => ({
    participant_code: account.user.participantCode, status: account.status, experiment_count: account.sessions.length,
    subjective_count: account.subjective.length, compensation_amount: account.compensation.amount,
    compensation_status: account.compensation.status, compensation_note: account.compensation.note,
    created_at: account.createdAt, last_login: account.user.lastLogin
  }));
  csvResponse(res, 'finefatigue-users.csv', ['participant_code', 'status', 'experiment_count', 'subjective_count', 'compensation_amount', 'compensation_status', 'compensation_note', 'created_at', 'last_login'], rows);
});
app.post('/api/ai/motivation', async (req, res) => {
  const apiKey = process.env.MIMO_API_KEY;
  if (!apiKey) return res.status(503).json({ error: 'MIMO_API_KEY is not configured on the server.' });
  const { overallScore, subjectiveRating, language = 'zh', tier } = req.body || {};
  const languageName = language === 'en' ? 'English' : 'Simplified Chinese';
  const prompt = `You are a cautious laboratory fatigue-study assistant. Produce supportive, non-diagnostic recovery guidance in ${languageName}. Objective fatigue index: ${Number(overallScore)} / 100. Subjective self-rating: ${subjectiveRating ?? 'not provided'} / 10. Fatigue tier: ${tier}. Do not claim a medical diagnosis and do not use the subjective rating to revise the objective score. Return ONLY valid JSON with this exact shape: {"title":"","message":"","subtext":"","category":"comfort|encouragement|praise|recovery_drill","recoveryAction":{"actionTitle":"","drillDuration":"","steps":["",""]}}.`;
  try {
    const baseUrl = String(process.env.MIMO_BASE_URL || 'https://api.xiaomimimo.com/v1').replace(/\/+$/, '');
    const response = await fetch(baseUrl + '/chat/completions', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.MIMO_MODEL || 'mimo-v2.5-pro',
        messages: [
          { role: 'system', content: 'Return only valid JSON matching the requested schema.' },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' },
        max_completion_tokens: 1024,
        thinking: { type: 'disabled' }
      })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload?.error?.message || 'MiMo API returned an error.');
    const message = JSON.parse(payload?.choices?.[0]?.message?.content || '{}');
    if (!message.title || !message.message || !Array.isArray(message.recoveryAction?.steps)) throw new Error('MiMo response did not match the expected advice schema.');
    res.json({ message });
  } catch (error) {
    console.error('MiMo motivation request failed:', error instanceof Error ? error.message : error);
    res.status(502).json({ error: 'The AI advice service is temporarily unavailable.' });
  }
});
const distDir = path.join(rootDir, 'dist');
app.use(express.static(distDir));
app.get('*', (_req, res) => res.sendFile(path.join(distDir, 'index.html')));
const port = Number(process.env.PORT || 3000);
app.listen(port, '0.0.0.0', () => console.log(`FineFatigue LAN server listening at http://0.0.0.0:${port}`));
