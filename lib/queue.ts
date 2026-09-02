/**
 * The most scans allowed to run at once.
 *
 * Not a capacity limit — Vercel would run far more without noticing. It is a
 * spending ceiling: the most we can burn in an hour is the same whether ten or
 * ten thousand people are waiting. Whoever floods the queue lengthens their own
 * wait, not our bill.
 *
 * Read it as a ceiling, not a target. Parallelism comes from how many chains
 * are running: each click starts one, and the monitoring run starts several at
 * once. A single chain still drains one scan at a time, at roughly one per ten
 * seconds — five at once is what five chains do, not what one chain does.
 *
 * It lives here rather than in the worker because the monitoring run needs the
 * same number: starting more chains than there are slots only creates
 * invocations that discover every slot busy and go home.
 */
export const MAX_RUNNING = 5;
