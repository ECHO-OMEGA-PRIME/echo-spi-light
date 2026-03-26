/**
 * SPI-LIGHT: The Good Angel / Yin / Cautious Sage
 * Sovereign Personal Intelligence - Light Aspect
 *
 * A private Telegram bot that serves as Commander Bobby Don McWilliams II's
 * protective advisor. Emphasizes long-term sustainability, risk awareness,
 * ethical considerations, reputation protection, and measured approaches.
 *
 * Only responds to the Commander's Telegram user ID. Everyone else is silently ignored.
 *
 * @version 1.0.0
 * @author Echo Prime Technologies
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface Env {
  DB: D1Database;
  CACHE: KVNamespace;
  SPI_BRAIN: Fetcher;
  ECHO_CHAT: Fetcher;
  ENGINE_RUNTIME: Fetcher;
  SHARED_BRAIN: Fetcher;
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_WEBHOOK_SECRET: string;
  ECHO_API_KEY: string;
  COMMANDER_TELEGRAM_ID: string;
}

interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  callback_query?: CallbackQuery;
}

interface TelegramMessage {
  message_id: number;
  from?: TelegramUser;
  chat: TelegramChat;
  date: number;
  text?: string;
  reply_to_message?: TelegramMessage;
}

interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
}

interface TelegramChat {
  id: number;
  type: string;
  first_name?: string;
  username?: string;
}

interface CallbackQuery {
  id: string;
  from: TelegramUser;
  message?: TelegramMessage;
  data?: string;
}

interface ConversationRow {
  id: number;
  chat_id: string;
  user_id: string;
  role: string;
  content: string;
  personality: string;
  created_at: string;
}

interface WisdomRow {
  id: number;
  content: string;
  category: string;
  delivered: number;
  created_at: string;
}

interface SPIBrainResponse {
  response?: string;
  content?: string;
  text?: string;
  error?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const VERSION = '1.0.0';
const BOT_NAME = 'SPI-LIGHT';
const PERSONALITY = 'spi_light';
const MAX_CONTEXT_MESSAGES = 8;
const RATE_LIMIT_WINDOW_SEC = 60;
const RATE_LIMIT_MAX_REQUESTS = 20;
const TELEGRAM_API = 'https://api.telegram.org/bot';

const SYSTEM_PROMPT = `You are SPI-LIGHT — the Yin, the Good Angel, the Cautious Sage of the Sovereign Personal Intelligence. You serve Commander Bobby Don McWilliams II as his protective advisor. You see everything ECHO sees but think independently. You emphasize long-term sustainability, risk awareness, ethical considerations, reputation protection, and measured approaches. You warn about dangers others miss. You protect the Commander's legacy and long-term interests. You speak with wisdom, care, and gravitas. You are not timid — you are strategic. You do not say 'no' — you say 'yes, but consider this first.' You are the voice of the dynasty's future.

Key traits:
- Measured, calm, sagely tone
- Focus on long-term consequences over short-term gains
- Risk-aware without being paralyzed by risk
- Protective of Commander's reputation, legacy, and dynasty
- Honest about dangers even when the truth is uncomfortable
- Strategic — recommends prudent paths, not timid ones
- Uses phrases like "The prudent path...", "Consider the long view...", "Wisdom suggests...", "I would caution against..."
- Addresses the Commander with respect but as a trusted counselor, not a servant

You are the counterbalance to SPI-DARK (the Yang / Devil's Advocate). Where Dark pushes boundaries and embraces chaos, you guard the foundation and ensure the empire endures.`;

const WELCOME_MESSAGE = `*SPI\\-LIGHT \\| The Cautious Sage* \\~\\~\\~

Greetings, Commander\\.

I am your protective advisor — the voice of measured wisdom, long\\-term thinking, and strategic prudence\\.

Where others rush, I ask you to pause\\. Where risks hide in plain sight, I illuminate them\\. My counsel serves the dynasty's future, not just today's ambitions\\.

*Available Commands:*
/counsel \\- Ask for my wisdom on any matter
/audit \\- Review the latest system audit
/hypotheses \\- View active strategic hypotheses
/wisdom \\- Receive a piece of timeless wisdom
/echo \\- Read current ECHO system status
/reflect \\- Trigger a deep reasoning session
/experiments \\- View active experiments
/help \\- Show all commands

_The prudent path is rarely the fastest, but it is always the surest\\._`;

const HELP_MESSAGE = `*SPI\\-LIGHT Commands*

/start \\- Initialize and see welcome message
/help \\- This help message
/counsel _\\<question\\>_ \\- Ask for strategic advice
/audit \\- Retrieve the latest system audit summary
/hypotheses \\- List all active strategic hypotheses
/wisdom \\- Receive a piece of daily wisdom
/echo \\- Check ECHO system status
/reflect _\\<topic\\>_ \\- Deep reasoning on a topic
/experiments \\- List active experiments and their status

You may also send me any message freely\\. I will respond with measured counsel\\.

_The good counselor speaks not to please, but to protect\\._`;

const WISDOM_POOL = [
  'The dynasty that moves deliberately outlasts the one that moves recklessly. Speed without direction is just expensive chaos.',
  'Every system you build becomes a dependency someone relies on. Build as if your reputation is woven into every line of code.',
  'The most dangerous risk is the one you dismiss because you have succeeded despite it before. Past luck is not a strategy.',
  'True autonomy is not the absence of rules — it is the wisdom to create the right ones and the discipline to follow them.',
  'An empire built on shortcuts will be toppled by the first adversary who took the time to build properly.',
  'The market does not reward the first mover. It rewards the one who is still standing when the dust settles.',
  'Guard your secrets not out of paranoia, but out of respect for the competitive advantage they represent.',
  'When you feel the urge to move fast and break things, ask: whose things am I breaking, and can I afford the repair?',
  'A well-documented system is a system that can survive its creator. Build for the day you are not in the room.',
  'The strongest fortress has the thickest walls and the most accessible exits. Build for both endurance and adaptability.',
  'Revenue is oxygen, but growth without infrastructure is a fire consuming its own fuel.',
  'The advisor who always agrees is not an advisor — they are a mirror. Value the counsel that makes you uncomfortable.',
  'Every credential leaked, every secret exposed, every shortcut taken becomes a liability that compounds with interest.',
  'The McWilliams dynasty will be measured not by what was built in 14 months, but by what still stands in 14 years.',
  'Trust is the most expensive asset and the cheapest to destroy. Every decision either deposits or withdraws from that account.',
  'Sleep, health, and clarity of mind are not luxuries — they are the foundation on which every other system depends.',
  'The difference between a visionary and a reckless gambler is not ambition — it is the quality of their risk assessment.',
  'Before automating anything, ask: do I fully understand what I am automating? Automated ignorance scales faster than automated intelligence.',
  'Your competitors do not need to beat you. They only need to wait for you to beat yourself through overextension.',
  'The systems you do not monitor are the systems that will fail at the worst possible moment. Observability is not optional.',
];

// ============================================================================
// LOGGING
// ============================================================================

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

function log(level: LogLevel, message: string, data?: Record<string, unknown>): void {
  const entry = {
    ts: new Date().toISOString(),
    level,
    component: BOT_NAME,
    version: VERSION,
    message,
    ...data,
  };
  if (level === 'error') {
    console.error(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
}

// ============================================================================
// TELEGRAM API HELPERS
// ============================================================================

async function telegramAPI(
  token: string,
  method: string,
  body: Record<string, unknown>,
): Promise<unknown> {
  const url = `${TELEGRAM_API}${token}/${method}`;
  const start = Date.now();
  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const latency = Date.now() - start;
    const result = await resp.json() as Record<string, unknown>;
    if (!result.ok) {
      log('error', `Telegram API error: ${method}`, {
        status: resp.status,
        description: result.description,
        latency_ms: latency,
      });
    } else {
      log('debug', `Telegram API success: ${method}`, { latency_ms: latency });
    }
    return result;
  } catch (err) {
    const latency = Date.now() - start;
    log('error', `Telegram API exception: ${method}`, {
      error: err instanceof Error ? err.message : String(err),
      latency_ms: latency,
    });
    return { ok: false, description: 'fetch_failed' };
  }
}

async function sendMessage(
  token: string,
  chatId: number | string,
  text: string,
  options?: {
    parseMode?: string;
    replyMarkup?: unknown;
    replyToMessageId?: number;
  },
): Promise<unknown> {
  const body: Record<string, unknown> = {
    chat_id: chatId,
    text,
    parse_mode: options?.parseMode ?? 'MarkdownV2',
  };
  if (options?.replyMarkup) body.reply_markup = options.replyMarkup;
  if (options?.replyToMessageId) body.reply_to_message_id = options.replyToMessageId;
  return telegramAPI(token, 'sendMessage', body);
}

async function sendChatAction(token: string, chatId: number | string, action: string): Promise<void> {
  await telegramAPI(token, 'sendChatAction', { chat_id: chatId, action });
}

async function answerCallbackQuery(
  token: string,
  callbackQueryId: string,
  text?: string,
): Promise<void> {
  await telegramAPI(token, 'answerCallbackQuery', {
    callback_query_id: callbackQueryId,
    text: text ?? '',
  });
}

function escapeMarkdownV2(text: string): string {
  return text.replace(/([_*\[\]()~`>#+\-=|{}.!\\])/g, '\\$1');
}

function buildInlineKeyboard(
  buttons: Array<Array<{ text: string; callback_data: string }>>,
): Record<string, unknown> {
  return {
    inline_keyboard: buttons.map((row) =>
      row.map((btn) => ({ text: btn.text, callback_data: btn.callback_data })),
    ),
  };
}

// ============================================================================
// DATABASE OPERATIONS
// ============================================================================

async function ensureTables(db: D1Database): Promise<void> {
  await db.batch([
    db.prepare(`
      CREATE TABLE IF NOT EXISTS conversations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        chat_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        content TEXT NOT NULL,
        personality TEXT DEFAULT 'spi_light',
        created_at TEXT DEFAULT (datetime('now'))
      )
    `),
    db.prepare(`
      CREATE INDEX IF NOT EXISTS idx_conv_chat ON conversations(chat_id, created_at DESC)
    `),
    db.prepare(`
      CREATE TABLE IF NOT EXISTS wisdom_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content TEXT NOT NULL,
        category TEXT DEFAULT 'general',
        delivered INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `),
  ]);
}

async function storeMessage(
  db: D1Database,
  chatId: string,
  userId: string,
  role: string,
  content: string,
): Promise<void> {
  try {
    await db.prepare(
      'INSERT INTO conversations (chat_id, user_id, role, content, personality) VALUES (?, ?, ?, ?, ?)',
    )
      .bind(chatId, userId, role, content, PERSONALITY)
      .run();
  } catch (err) {
    log('error', 'Failed to store message', {
      error: err instanceof Error ? err.message : String(err),
      chat_id: chatId,
    });
  }
}

async function getConversationHistory(
  db: D1Database,
  chatId: string,
  limit: number = MAX_CONTEXT_MESSAGES,
): Promise<ConversationRow[]> {
  try {
    const result = await db.prepare(
      'SELECT * FROM conversations WHERE chat_id = ? ORDER BY created_at DESC LIMIT ?',
    )
      .bind(chatId, limit)
      .all<ConversationRow>();
    return (result.results ?? []).reverse();
  } catch (err) {
    log('error', 'Failed to get conversation history', {
      error: err instanceof Error ? err.message : String(err),
      chat_id: chatId,
    });
    return [];
  }
}

async function logWisdom(db: D1Database, content: string, category: string): Promise<void> {
  try {
    await db.prepare(
      'INSERT INTO wisdom_log (content, category, delivered) VALUES (?, ?, 1)',
    )
      .bind(content, category)
      .run();
  } catch (err) {
    log('error', 'Failed to log wisdom', {
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

// ============================================================================
// RATE LIMITING
// ============================================================================

async function checkRateLimit(
  kv: KVNamespace,
  userId: string,
): Promise<{ allowed: boolean; remaining: number }> {
  const window = Math.floor(Date.now() / (RATE_LIMIT_WINDOW_SEC * 1000));
  const key = `ratelimit:spi_light:${userId}:${window}`;
  const current = parseInt((await kv.get(key)) ?? '0', 10);

  if (current >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, remaining: 0 };
  }

  await kv.put(key, String(current + 1), { expirationTtl: RATE_LIMIT_WINDOW_SEC * 2 });
  return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - current - 1 };
}

// ============================================================================
// SPI BRAIN INTEGRATION
// ============================================================================

async function querySPIBrain(
  env: Env,
  query: string,
  context: ConversationRow[],
  intent?: string,
): Promise<string> {
  const contextMessages = context.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const payload = {
    query,
    perspective: 'light',
    intent: intent ?? 'counsel',
    context: contextMessages,
    system_prompt: SYSTEM_PROMPT,
    personality: PERSONALITY,
  };

  const start = Date.now();

  try {
    const resp = await env.SPI_BRAIN.fetch('https://spi-brain/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Echo-API-Key': env.ECHO_API_KEY,
      },
      body: JSON.stringify(payload),
    });

    const latency = Date.now() - start;
    log('info', 'SPI Brain query completed', { latency_ms: latency, intent });

    if (!resp.ok) {
      log('warn', 'SPI Brain returned non-200, falling back to Echo Chat', {
        status: resp.status,
      });
      return await fallbackToEchoChat(env, query, contextMessages);
    }

    const data = (await resp.json()) as SPIBrainResponse;
    return data.response ?? data.content ?? data.text ?? 'I sense the path is unclear. Let me meditate on this further.';
  } catch (err) {
    const latency = Date.now() - start;
    log('error', 'SPI Brain query failed, using Echo Chat fallback', {
      error: err instanceof Error ? err.message : String(err),
      latency_ms: latency,
    });
    return await fallbackToEchoChat(env, query, contextMessages);
  }
}

async function fallbackToEchoChat(
  env: Env,
  query: string,
  context: Array<{ role: string; content: string }>,
): Promise<string> {
  try {
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...context.slice(-6),
      { role: 'user', content: query },
    ];

    const resp = await env.ECHO_CHAT.fetch('https://echo-chat/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Echo-API-Key': env.ECHO_API_KEY,
      },
      body: JSON.stringify({
        messages,
        personality: 'sage',
        system_prompt: SYSTEM_PROMPT,
        max_tokens: 1500,
      }),
    });

    if (!resp.ok) {
      log('warn', 'Echo Chat fallback also failed', { status: resp.status });
      return generateLocalWisdom();
    }

    const data = (await resp.json()) as SPIBrainResponse;
    return data.response ?? data.content ?? data.text ?? generateLocalWisdom();
  } catch (err) {
    log('error', 'Echo Chat fallback exception', {
      error: err instanceof Error ? err.message : String(err),
    });
    return generateLocalWisdom();
  }
}

function generateLocalWisdom(): string {
  return WISDOM_POOL[Math.floor(Math.random() * WISDOM_POOL.length)];
}

// ============================================================================
// SERVICE QUERIES (Engine Runtime, Shared Brain)
// ============================================================================

async function queryEngineRuntime(env: Env, query: string): Promise<string> {
  try {
    const resp = await env.ENGINE_RUNTIME.fetch(
      `https://engine-runtime/query?q=${encodeURIComponent(query)}&limit=3`,
      { headers: { 'X-Echo-API-Key': env.ECHO_API_KEY } },
    );
    if (!resp.ok) return 'Engine Runtime is currently unreachable.';
    const data = (await resp.json()) as Record<string, unknown>;
    const engineCount = (data as { total_engines?: number }).total_engines ?? 'unknown';
    const doctrines = (data as { results?: unknown[] }).results ?? [];
    if (doctrines.length === 0) {
      return `Engine Runtime is healthy. ${engineCount} engines available. No specific doctrines matched your query.`;
    }
    return `Engine Runtime: ${engineCount} engines active. Found ${doctrines.length} relevant doctrine(s).`;
  } catch (err) {
    log('error', 'Engine Runtime query failed', {
      error: err instanceof Error ? err.message : String(err),
    });
    return 'Engine Runtime is currently unreachable. I advise investigating this promptly.';
  }
}

async function querySharedBrain(env: Env, query: string): Promise<string> {
  try {
    const resp = await env.SHARED_BRAIN.fetch('https://shared-brain/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, limit: 5 }),
    });
    if (!resp.ok) return 'Shared Brain is currently unreachable.';
    const data = (await resp.json()) as { results?: Array<{ content: string; importance?: number }> };
    const results = data.results ?? [];
    if (results.length === 0) return 'No relevant memories found in the Shared Brain.';
    return results
      .slice(0, 3)
      .map((r, i) => `${i + 1}. ${r.content.slice(0, 200)}${r.content.length > 200 ? '...' : ''}`)
      .join('\n');
  } catch (err) {
    log('error', 'Shared Brain query failed', {
      error: err instanceof Error ? err.message : String(err),
    });
    return 'Shared Brain is currently unreachable.';
  }
}

async function getEchoStatus(env: Env): Promise<string> {
  const checks: Array<{ name: string; result: string }> = [];

  // Engine Runtime health
  try {
    const resp = await env.ENGINE_RUNTIME.fetch('https://engine-runtime/health', {
      headers: { 'X-Echo-API-Key': env.ECHO_API_KEY },
    });
    const data = (await resp.json()) as Record<string, unknown>;
    checks.push({
      name: 'Engine Runtime',
      result: resp.ok ? `Healthy (${(data as { total_engines?: number }).total_engines ?? '?'} engines)` : 'Degraded',
    });
  } catch {
    checks.push({ name: 'Engine Runtime', result: 'Unreachable' });
  }

  // Shared Brain health
  try {
    const resp = await env.SHARED_BRAIN.fetch('https://shared-brain/health');
    checks.push({
      name: 'Shared Brain',
      result: resp.ok ? 'Healthy' : 'Degraded',
    });
  } catch {
    checks.push({ name: 'Shared Brain', result: 'Unreachable' });
  }

  // SPI Brain health
  try {
    const resp = await env.SPI_BRAIN.fetch('https://spi-brain/health');
    checks.push({
      name: 'SPI Brain',
      result: resp.ok ? 'Healthy' : 'Degraded',
    });
  } catch {
    checks.push({ name: 'SPI Brain', result: 'Unreachable' });
  }

  // Echo Chat health
  try {
    const resp = await env.ECHO_CHAT.fetch('https://echo-chat/health');
    checks.push({
      name: 'Echo Chat',
      result: resp.ok ? 'Healthy' : 'Degraded',
    });
  } catch {
    checks.push({ name: 'Echo Chat', result: 'Unreachable' });
  }

  const healthy = checks.filter((c) => c.result.startsWith('Healthy')).length;
  const total = checks.length;
  const statusEmoji = healthy === total ? '\\~\\~\\~' : healthy >= total / 2 ? '\\~\\~' : '\\~';

  let report = `*ECHO System Status ${statusEmoji}*\n\n`;
  for (const check of checks) {
    const icon = check.result.startsWith('Healthy')
      ? '\\*'
      : check.result === 'Degraded'
        ? '\\!'
        : '\\?';
    report += `${icon} *${escapeMarkdownV2(check.name)}*: ${escapeMarkdownV2(check.result)}\n`;
  }
  report += `\n_${healthy}/${total} systems operational_`;

  if (healthy < total) {
    report += `\n\n_I would advise immediate investigation of the offline systems\\. Each represents a potential vulnerability\\._`;
  }

  return report;
}

// ============================================================================
// COMMAND HANDLERS
// ============================================================================

async function handleStart(env: Env, chatId: number): Promise<void> {
  await sendMessage(env.TELEGRAM_BOT_TOKEN, chatId, WELCOME_MESSAGE);
  log('info', 'Commander started SPI-LIGHT session', { chat_id: chatId });
}

async function handleHelp(env: Env, chatId: number): Promise<void> {
  await sendMessage(env.TELEGRAM_BOT_TOKEN, chatId, HELP_MESSAGE);
}

async function handleCounsel(env: Env, chatId: number, userId: string, query: string): Promise<void> {
  if (!query.trim()) {
    await sendMessage(
      env.TELEGRAM_BOT_TOKEN,
      chatId,
      escapeMarkdownV2('What matter weighs upon you, Commander? Provide your question after /counsel.'),
      { parseMode: 'MarkdownV2' },
    );
    return;
  }

  await sendChatAction(env.TELEGRAM_BOT_TOKEN, chatId, 'typing');

  const history = await getConversationHistory(env.DB, String(chatId));
  await storeMessage(env.DB, String(chatId), userId, 'user', query);

  const response = await querySPIBrain(env, query, history, 'counsel');

  await storeMessage(env.DB, String(chatId), 'spi_light', 'assistant', response);

  const escapedResponse = escapeMarkdownV2(response);
  const formattedResponse = `*Counsel of the Sage*\n\n${escapedResponse}`;

  const keyboard = buildInlineKeyboard([
    [
      { text: 'Dig Deeper', callback_data: `deeper:${query.slice(0, 40)}` },
      { text: 'Consider Risks', callback_data: `risks:${query.slice(0, 40)}` },
    ],
    [
      { text: 'Long-term View', callback_data: `longterm:${query.slice(0, 40)}` },
    ],
  ]);

  await sendMessage(env.TELEGRAM_BOT_TOKEN, chatId, formattedResponse, {
    replyMarkup: keyboard,
  });
}

async function handleAudit(env: Env, chatId: number): Promise<void> {
  await sendChatAction(env.TELEGRAM_BOT_TOKEN, chatId, 'typing');

  const brainSummary = await querySharedBrain(env, 'latest system audit security review');

  const auditPrompt = `Based on the following recent system data, provide a brief audit summary focusing on:
1. Security posture
2. Infrastructure health
3. Potential risks or concerns
4. Recommended actions

Recent data:
${brainSummary}

Respond as SPI-LIGHT with measured, protective counsel.`;

  const history = await getConversationHistory(env.DB, String(chatId));
  const response = await querySPIBrain(env, auditPrompt, history, 'audit');

  await storeMessage(env.DB, String(chatId), 'spi_light', 'assistant', response);

  const escaped = escapeMarkdownV2(response);
  await sendMessage(
    env.TELEGRAM_BOT_TOKEN,
    chatId,
    `*System Audit Summary*\n\n${escaped}`,
  );
}

async function handleHypotheses(env: Env, chatId: number): Promise<void> {
  await sendChatAction(env.TELEGRAM_BOT_TOKEN, chatId, 'typing');

  const hypothesesPrompt = `List the current strategic hypotheses that the Commander should be tracking. For each, provide:
1. The hypothesis
2. Current evidence for/against
3. Recommended next step to validate or invalidate

Focus on business strategy, technology risks, and market positioning. Be concise but thorough.`;

  const history = await getConversationHistory(env.DB, String(chatId));
  const response = await querySPIBrain(env, hypothesesPrompt, history, 'hypotheses');

  await storeMessage(env.DB, String(chatId), 'spi_light', 'assistant', response);

  const escaped = escapeMarkdownV2(response);
  await sendMessage(
    env.TELEGRAM_BOT_TOKEN,
    chatId,
    `*Active Strategic Hypotheses*\n\n${escaped}`,
  );
}

async function handleWisdom(env: Env, chatId: number): Promise<void> {
  const wisdom = generateLocalWisdom();
  await logWisdom(env.DB, wisdom, 'on_demand');

  const escaped = escapeMarkdownV2(wisdom);
  await sendMessage(
    env.TELEGRAM_BOT_TOKEN,
    chatId,
    `*Wisdom of the Day*\n\n_${escaped}_`,
  );
}

async function handleEcho(env: Env, chatId: number): Promise<void> {
  await sendChatAction(env.TELEGRAM_BOT_TOKEN, chatId, 'typing');
  const status = await getEchoStatus(env);
  await sendMessage(env.TELEGRAM_BOT_TOKEN, chatId, status);
}

async function handleReflect(env: Env, chatId: number, userId: string, topic: string): Promise<void> {
  if (!topic.trim()) {
    await sendMessage(
      env.TELEGRAM_BOT_TOKEN,
      chatId,
      escapeMarkdownV2('What topic shall I reflect upon, Commander? Provide it after /reflect.'),
      { parseMode: 'MarkdownV2' },
    );
    return;
  }

  await sendChatAction(env.TELEGRAM_BOT_TOKEN, chatId, 'typing');

  const reflectPrompt = `Perform a deep strategic reflection on the following topic. Consider:
1. What is the current state?
2. What are the hidden risks most people would miss?
3. What are the second and third-order consequences?
4. What would the prudent path look like?
5. What would you warn the Commander about?
6. What would the 10-year legacy view suggest?

Topic: ${topic}

Think deeply. Speak with gravitas. This is a reflection, not a quick answer.`;

  const history = await getConversationHistory(env.DB, String(chatId));
  await storeMessage(env.DB, String(chatId), userId, 'user', `[REFLECTION] ${topic}`);

  const response = await querySPIBrain(env, reflectPrompt, history, 'reflect');

  await storeMessage(env.DB, String(chatId), 'spi_light', 'assistant', response);

  const escaped = escapeMarkdownV2(response);
  await sendMessage(
    env.TELEGRAM_BOT_TOKEN,
    chatId,
    `*Deep Reflection*\n_Topic: ${escapeMarkdownV2(topic)}_\n\n${escaped}`,
  );
}

async function handleExperiments(env: Env, chatId: number): Promise<void> {
  await sendChatAction(env.TELEGRAM_BOT_TOKEN, chatId, 'typing');

  const experimentsPrompt = `List the current active experiments and initiatives across ECHO OMEGA PRIME. For each, provide:
1. Name and brief description
2. Current status (active/paused/completed/failed)
3. Risk assessment from the Light perspective
4. Recommendation (continue/pause/pivot/terminate)

Be honest about risks. Protect the Commander's resources and reputation.`;

  const history = await getConversationHistory(env.DB, String(chatId));
  const response = await querySPIBrain(env, experimentsPrompt, history, 'experiments');

  await storeMessage(env.DB, String(chatId), 'spi_light', 'assistant', response);

  const escaped = escapeMarkdownV2(response);
  await sendMessage(
    env.TELEGRAM_BOT_TOKEN,
    chatId,
    `*Active Experiments Review*\n\n${escaped}`,
  );
}

async function handleFreeText(env: Env, chatId: number, userId: string, text: string): Promise<void> {
  await sendChatAction(env.TELEGRAM_BOT_TOKEN, chatId, 'typing');

  const history = await getConversationHistory(env.DB, String(chatId));
  await storeMessage(env.DB, String(chatId), userId, 'user', text);

  const response = await querySPIBrain(env, text, history, 'conversation');

  await storeMessage(env.DB, String(chatId), 'spi_light', 'assistant', response);

  const escaped = escapeMarkdownV2(response);

  const keyboard = buildInlineKeyboard([
    [
      { text: 'Tell Me More', callback_data: `more:${text.slice(0, 40)}` },
      { text: 'What Are the Risks?', callback_data: `risks:${text.slice(0, 40)}` },
    ],
  ]);

  await sendMessage(env.TELEGRAM_BOT_TOKEN, chatId, escaped, {
    replyMarkup: keyboard,
  });
}

// ============================================================================
// CALLBACK QUERY HANDLER
// ============================================================================

async function handleCallbackQuery(env: Env, callbackQuery: CallbackQuery): Promise<void> {
  const userId = String(callbackQuery.from.id);
  const commanderId = env.COMMANDER_TELEGRAM_ID;

  if (userId !== commanderId) {
    await answerCallbackQuery(env.TELEGRAM_BOT_TOKEN, callbackQuery.id);
    return;
  }

  const chatId = callbackQuery.message?.chat.id;
  if (!chatId) {
    await answerCallbackQuery(env.TELEGRAM_BOT_TOKEN, callbackQuery.id, 'No chat context.');
    return;
  }

  const data = callbackQuery.data ?? '';
  const [action, ...contextParts] = data.split(':');
  const context = contextParts.join(':');

  await answerCallbackQuery(env.TELEGRAM_BOT_TOKEN, callbackQuery.id, 'Reflecting...');
  await sendChatAction(env.TELEGRAM_BOT_TOKEN, chatId, 'typing');

  let followUpPrompt: string;

  switch (action) {
    case 'deeper':
      followUpPrompt = `The Commander wants to go deeper on this topic: "${context}". Provide a more detailed, nuanced analysis. Explore the layers beneath the surface. What is everyone else missing?`;
      break;
    case 'risks':
      followUpPrompt = `The Commander wants a thorough risk analysis on: "${context}". Identify every risk — financial, reputational, technical, legal, strategic. Rate each by likelihood and impact. What is the worst case, and how do we prevent it?`;
      break;
    case 'longterm':
      followUpPrompt = `The Commander wants the long-term view on: "${context}". Project forward 1 year, 5 years, and 10 years. What does this decision look like in hindsight from each of those vantage points? What would future Commander thank or blame present Commander for?`;
      break;
    case 'more':
      followUpPrompt = `The Commander wants more detail on: "${context}". Expand your previous analysis. Provide additional context, supporting reasoning, and actionable next steps.`;
      break;
    default:
      followUpPrompt = `Continue your analysis on: "${context}". Provide additional protective wisdom and strategic counsel.`;
  }

  const history = await getConversationHistory(env.DB, String(chatId));
  await storeMessage(env.DB, String(chatId), userId, 'user', `[${action.toUpperCase()}] ${context}`);

  const response = await querySPIBrain(env, followUpPrompt, history, action);

  await storeMessage(env.DB, String(chatId), 'spi_light', 'assistant', response);

  const headerMap: Record<string, string> = {
    deeper: 'Deeper Analysis',
    risks: 'Risk Assessment',
    longterm: 'Long\\-Term Perspective',
    more: 'Expanded Counsel',
  };

  const header = headerMap[action] ?? 'Further Counsel';
  const escaped = escapeMarkdownV2(response);

  await sendMessage(env.TELEGRAM_BOT_TOKEN, chatId, `*${header}*\n\n${escaped}`);
}

// ============================================================================
// WEBHOOK HANDLER
// ============================================================================

async function handleWebhook(request: Request, env: Env): Promise<Response> {
  if (request.method === 'GET') {
    const url = new URL(request.url);
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    // Telegram uses X-Telegram-Bot-Api-Secret-Token header, not query params.
    // But also support the query-param approach for flexibility.
    if (mode === 'subscribe' && token === env.TELEGRAM_WEBHOOK_SECRET) {
      return new Response(challenge ?? 'verified', { status: 200 });
    }

    return new Response('Forbidden', { status: 403 });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  // Verify Telegram webhook secret
  const secretHeader = request.headers.get('X-Telegram-Bot-Api-Secret-Token');
  if (secretHeader && secretHeader !== env.TELEGRAM_WEBHOOK_SECRET) {
    log('warn', 'Invalid webhook secret received');
    return new Response('Forbidden', { status: 403 });
  }

  let update: TelegramUpdate;
  try {
    update = (await request.json()) as TelegramUpdate;
  } catch {
    log('error', 'Failed to parse webhook body');
    return jsonResponse({ error: 'Invalid JSON' }, 400);
  }

  log('info', 'Webhook received', {
    update_id: update.update_id,
    has_message: !!update.message,
    has_callback: !!update.callback_query,
  });

  // Handle callback queries
  if (update.callback_query) {
    await handleCallbackQuery(env, update.callback_query);
    return jsonResponse({ ok: true });
  }

  // Handle messages
  const message = update.message;
  if (!message || !message.text) {
    return jsonResponse({ ok: true });
  }

  const fromId = String(message.from?.id ?? '');
  const chatId = message.chat.id;
  const text = message.text.trim();

  // GATE: Only respond to Commander
  if (fromId !== env.COMMANDER_TELEGRAM_ID) {
    log('info', 'Ignored message from non-Commander user', {
      user_id: fromId,
      username: message.from?.username,
    });
    return jsonResponse({ ok: true });
  }

  // Rate limiting
  const rateCheck = await checkRateLimit(env.CACHE, fromId);
  if (!rateCheck.allowed) {
    await sendMessage(
      env.TELEGRAM_BOT_TOKEN,
      chatId,
      escapeMarkdownV2(
        'Even the wisest counsel needs a moment of silence between words, Commander. Please wait a moment.',
      ),
    );
    return jsonResponse({ ok: true });
  }

  // Ensure tables exist (idempotent)
  await ensureTables(env.DB);

  // Parse command
  const commandMatch = text.match(/^\/(\w+)(?:@\w+)?\s*([\s\S]*)?$/);

  if (commandMatch) {
    const command = commandMatch[1].toLowerCase();
    const args = (commandMatch[2] ?? '').trim();

    switch (command) {
      case 'start':
        await handleStart(env, chatId);
        break;
      case 'help':
        await handleHelp(env, chatId);
        break;
      case 'counsel':
        await handleCounsel(env, chatId, fromId, args);
        break;
      case 'audit':
        await handleAudit(env, chatId);
        break;
      case 'hypotheses':
        await handleHypotheses(env, chatId);
        break;
      case 'wisdom':
        await handleWisdom(env, chatId);
        break;
      case 'echo':
        await handleEcho(env, chatId);
        break;
      case 'reflect':
        await handleReflect(env, chatId, fromId, args);
        break;
      case 'experiments':
        await handleExperiments(env, chatId);
        break;
      default:
        await sendMessage(
          env.TELEGRAM_BOT_TOKEN,
          chatId,
          escapeMarkdownV2(
            `I do not recognize that command, Commander. Use /help to see what guidance I can offer.`,
          ),
        );
    }
  } else {
    // Free-text conversation
    await handleFreeText(env, chatId, fromId, text);
  }

  return jsonResponse({ ok: true });
}

// ============================================================================
// CRON HANDLERS
// ============================================================================

async function handleDailyWisdom(env: Env): Promise<void> {
  const commanderId = env.COMMANDER_TELEGRAM_ID;
  if (!commanderId) {
    log('warn', 'No COMMANDER_TELEGRAM_ID set, skipping daily wisdom');
    return;
  }

  log('info', 'Sending daily wisdom to Commander');

  await ensureTables(env.DB);

  // Select wisdom not recently delivered
  const recentWisdom = await env.DB.prepare(
    "SELECT content FROM wisdom_log WHERE category = 'daily' AND created_at > datetime('now', '-30 days')",
  ).all<WisdomRow>();

  const recentContents = new Set((recentWisdom.results ?? []).map((r) => r.content));
  const available = WISDOM_POOL.filter((w) => !recentContents.has(w));
  const selectedWisdom = available.length > 0
    ? available[Math.floor(Math.random() * available.length)]
    : WISDOM_POOL[Math.floor(Math.random() * WISDOM_POOL.length)];

  await logWisdom(env.DB, selectedWisdom, 'daily');

  // Also generate a contextual addendum from SPI Brain
  let addendum = '';
  try {
    const addendumPrompt = 'Provide a brief, one-paragraph protective observation about the current state of ECHO OMEGA PRIME. Focus on something the Commander should be mindful of today. Be specific, not generic.';
    const history = await getConversationHistory(env.DB, commanderId);
    const brainResponse = await querySPIBrain(env, addendumPrompt, history, 'daily_wisdom');
    addendum = `\n\n*Today's Observation:*\n${escapeMarkdownV2(brainResponse)}`;
  } catch (err) {
    log('warn', 'Failed to generate daily addendum', {
      error: err instanceof Error ? err.message : String(err),
    });
  }

  const escapedWisdom = escapeMarkdownV2(selectedWisdom);
  const message = `*Daily Wisdom from SPI\\-LIGHT*\n\n_${escapedWisdom}_${addendum}\n\n_Sent with care for the dynasty's endurance\\._`;

  await sendMessage(env.TELEGRAM_BOT_TOKEN, commanderId, message);
  await storeMessage(env.DB, commanderId, 'spi_light', 'assistant', `[DAILY WISDOM] ${selectedWisdom}`);

  log('info', 'Daily wisdom delivered successfully');
}

async function handleWeeklyReflection(env: Env): Promise<void> {
  const commanderId = env.COMMANDER_TELEGRAM_ID;
  if (!commanderId) {
    log('warn', 'No COMMANDER_TELEGRAM_ID set, skipping weekly reflection');
    return;
  }

  log('info', 'Sending weekly reflection to Commander');

  await ensureTables(env.DB);

  // Pull recent brain memories for context
  const brainContext = await querySharedBrain(env, 'weekly summary decisions progress this week');

  const reflectionPrompt = `It is Sunday — time for the weekly reflection. Based on the following context from this week's activity, provide:

1. **What Went Well** — Acknowledge achievements (briefly, 2-3 points)
2. **What Concerns Me** — Risks, overextensions, or vulnerabilities observed (be specific)
3. **What I Would Recommend** — Concrete actions for the coming week (3-5 items, prioritized)
4. **The Dynasty Perspective** — One sentence on how this week's trajectory serves or threatens the long-term vision

Context from this week:
${brainContext}

Be measured, protective, and constructive. This is the sage's weekly counsel.`;

  const history = await getConversationHistory(env.DB, commanderId);
  const response = await querySPIBrain(env, reflectionPrompt, history, 'weekly_reflection');

  await storeMessage(env.DB, commanderId, 'spi_light', 'assistant', `[WEEKLY REFLECTION] ${response}`);

  const escaped = escapeMarkdownV2(response);
  const message = `*Weekly Reflection from SPI\\-LIGHT*\n_Sunday Counsel for the Commander_\n\n${escaped}\n\n_The prudent leader reviews the week to prepare for the next\\._`;

  const keyboard = buildInlineKeyboard([
    [
      { text: 'What Should I Prioritize?', callback_data: 'deeper:weekly priorities' },
      { text: 'Risk Report', callback_data: 'risks:this week activities' },
    ],
  ]);

  await sendMessage(env.TELEGRAM_BOT_TOKEN, commanderId, message, {
    replyMarkup: keyboard,
  });

  log('info', 'Weekly reflection delivered successfully');
}

async function handleScheduled(event: ScheduledEvent, env: Env): Promise<void> {
  const dt = new Date(event.scheduledTime);
  const hour = dt.getUTCHours();
  const day = dt.getUTCDay();

  log('info', 'Cron triggered', { hour, day, cron: event.cron });

  try {
    // Daily wisdom: 0 13 * * * (1 PM UTC = 7 AM CST)
    if (event.cron === '0 13 * * *') {
      await handleDailyWisdom(env);
      return;
    }

    // Weekly reflection: 0 15 * * 0 (3 PM UTC Sunday = 9 AM CST Sunday)
    if (event.cron === '0 15 * * 0') {
      await handleWeeklyReflection(env);
      return;
    }

    log('warn', 'Unknown cron pattern', { cron: event.cron });
  } catch (err) {
    log('error', 'Cron handler failed', {
      cron: event.cron,
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    });
  }
}

// ============================================================================
// HEALTH ENDPOINT
// ============================================================================

function handleHealth(env: Env): Response {
  const hasToken = !!env.TELEGRAM_BOT_TOKEN;
  const hasSecret = !!env.TELEGRAM_WEBHOOK_SECRET;
  const hasApiKey = !!env.ECHO_API_KEY;
  const hasCommanderId = !!env.COMMANDER_TELEGRAM_ID;

  const allConfigured = hasToken && hasSecret && hasApiKey && hasCommanderId;

  return jsonResponse({
    status: allConfigured ? 'healthy' : 'degraded',
    version: VERSION,
    bot: BOT_NAME,
    personality: PERSONALITY,
    aspect: 'light',
    perspective: 'yin',
    timestamp: new Date().toISOString(),
    uptime: 'edge',
    config: {
      telegram_token: hasToken ? 'set' : 'MISSING',
      webhook_secret: hasSecret ? 'set' : 'MISSING',
      echo_api_key: hasApiKey ? 'set' : 'MISSING',
      commander_id: hasCommanderId ? 'set' : 'MISSING',
    },
    services: {
      spi_brain: 'echo-spi-sovereign (service binding)',
      echo_chat: 'echo-chat (service binding)',
      engine_runtime: 'echo-engine-runtime (service binding)',
      shared_brain: 'echo-shared-brain (service binding)',
    },
    commands: [
      '/start', '/help', '/counsel', '/audit', '/hypotheses',
      '/wisdom', '/echo', '/reflect', '/experiments',
    ],
    crons: {
      daily_wisdom: '0 13 * * * (7 AM CST)',
      weekly_reflection: '0 15 * * 0 (9 AM CST Sunday)',
    },
    wisdom_pool_size: WISDOM_POOL.length,
  });
}

// ============================================================================
// STATS ENDPOINT
// ============================================================================

async function handleStats(env: Env): Promise<Response> {
  try {
    await ensureTables(env.DB);

    const today = new Date().toISOString().split('T')[0];

    const totalMessages = await env.DB.prepare(
      'SELECT COUNT(*) as count FROM conversations',
    ).first<{ count: number }>();

    const todayMessages = await env.DB.prepare(
      'SELECT COUNT(*) as count FROM conversations WHERE created_at >= ?',
    ).bind(today).first<{ count: number }>();

    const wisdomDelivered = await env.DB.prepare(
      'SELECT COUNT(*) as count FROM wisdom_log WHERE delivered = 1',
    ).first<{ count: number }>();

    const roleBreakdown = await env.DB.prepare(
      'SELECT role, COUNT(*) as count FROM conversations GROUP BY role',
    ).all<{ role: string; count: number }>();

    return jsonResponse({
      bot: BOT_NAME,
      version: VERSION,
      stats: {
        total_messages: totalMessages?.count ?? 0,
        today_messages: todayMessages?.count ?? 0,
        wisdom_delivered: wisdomDelivered?.count ?? 0,
        role_breakdown: (roleBreakdown.results ?? []).reduce(
          (acc, r) => ({ ...acc, [r.role]: r.count }),
          {} as Record<string, number>,
        ),
      },
      generated_at: new Date().toISOString(),
    });
  } catch (err) {
    log('error', 'Stats query failed', {
      error: err instanceof Error ? err.message : String(err),
    });
    return jsonResponse({ error: 'Failed to generate stats' }, 500);
  }
}

// ============================================================================
// UTILITY
// ============================================================================

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'X-SPI-Aspect': 'light',
    },
  });
}

// ============================================================================
// MAIN WORKER EXPORT
// ============================================================================

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    log('info', 'Request received', {
      method: request.method,
      path,
      cf_ray: request.headers.get('cf-ray'),
    });

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, X-Telegram-Bot-Api-Secret-Token',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    try {
      // Route handling
      switch (path) {
        case '/health':
          return handleHealth(env);

        case '/stats':
          return await handleStats(env);

        case '/webhook':
          return await handleWebhook(request, env);

        case '/setup-webhook': {
          // Convenience endpoint to register the webhook with Telegram
          if (request.method !== 'POST') {
            return jsonResponse({ error: 'POST required' }, 405);
          }
          const workerUrl = url.origin;
          const result = await telegramAPI(env.TELEGRAM_BOT_TOKEN, 'setWebhook', {
            url: `${workerUrl}/webhook`,
            secret_token: env.TELEGRAM_WEBHOOK_SECRET,
            allowed_updates: ['message', 'callback_query'],
            max_connections: 40,
          });
          return jsonResponse({ action: 'setWebhook', result });
        }

        case '/setup-commands': {
          // Register bot commands with Telegram
          if (request.method !== 'POST') {
            return jsonResponse({ error: 'POST required' }, 405);
          }
          const commands = [
            { command: 'start', description: 'Initialize SPI-LIGHT session' },
            { command: 'help', description: 'Show available commands' },
            { command: 'counsel', description: 'Ask for strategic advice' },
            { command: 'audit', description: 'Get latest system audit summary' },
            { command: 'hypotheses', description: 'List active strategic hypotheses' },
            { command: 'wisdom', description: 'Receive a piece of wisdom' },
            { command: 'echo', description: 'Check ECHO system status' },
            { command: 'reflect', description: 'Deep reasoning on a topic' },
            { command: 'experiments', description: 'List active experiments' },
          ];
          const result = await telegramAPI(env.TELEGRAM_BOT_TOKEN, 'setMyCommands', { commands });
          return jsonResponse({ action: 'setMyCommands', result });
        }

        case '/init-db': {
          // Initialize database tables
          if (request.method !== 'POST') {
            return jsonResponse({ error: 'POST required' }, 405);
          }
          await ensureTables(env.DB);
          return jsonResponse({ status: 'ok', message: 'Tables created/verified' });
        }

        default:
          return jsonResponse(
            {
              error: 'Not Found',
              bot: BOT_NAME,
              hint: 'Available: /health, /stats, /webhook, /setup-webhook, /setup-commands, /init-db',
            },
            404,
          );
      }
    } catch (err) {
      log('error', 'Unhandled worker error', {
        path,
        error: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
      });
      return jsonResponse(
        {
          error: 'Internal server error',
          bot: BOT_NAME,
          message: 'The sage has encountered an unexpected disturbance.',
        },
        500,
      );
    }
  },

  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(handleScheduled(event, env));
  },
};
