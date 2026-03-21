/* global TextEncoder, crypto, Response, URL */

/**
 * RateWise Rating API Worker
 *
 * 提供星評收集與查詢 API，資料儲存於 Cloudflare KV。
 *
 * 端點：
 *   GET  /ratewise/api/ratings     → 回傳彙總評分（ratingValue, ratingCount）
 *   POST /ratewise/api/ratings     → 提交評分（1-5 星），IP 30 天去重
 *
 * KV 鍵值設計：
 *   rating_sum    — 總分（number，以字串儲存）
 *   rating_count  — 評分人數（number，以字串儲存）
 *   vote_{ipHash} — IP 去重標記（TTL 30 天）
 *
 * @version 1.0.0
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://app.haotool.org',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

const VOTE_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 天 IP 去重視窗

/**
 * 對 IP 做單向雜湊（隱私保護）。
 * 使用 SHA-256 + Worker secret 鹽值（環境變數 IP_SALT）。
 */
async function hashIp(ip, salt) {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${salt}:${ip}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** 建立 JSON 回應，附帶 CORS 標頭。 */
function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}

/** 建立 OPTIONS 預檢回應。 */
function corsPreflightResponse() {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

/** 取得目前彙總評分。 */
async function handleGet(kv) {
  const [sumStr, countStr] = await Promise.all([kv.get('rating_sum'), kv.get('rating_count')]);

  const ratingSum = parseFloat(sumStr ?? '0');
  const ratingCount = parseInt(countStr ?? '0', 10);

  if (ratingCount === 0) {
    return jsonResponse({ ratingValue: null, ratingCount: 0 });
  }

  const ratingValue = Math.round((ratingSum / ratingCount) * 10) / 10;

  return jsonResponse({ ratingValue, ratingCount });
}

/** 提交新評分（1-5 星），並做 IP 去重。 */
async function handlePost(request, kv, env) {
  // 解析請求主體。
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: '請求格式錯誤' }, 400);
  }

  const { rating } = body;
  if (typeof rating !== 'number' || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
    return jsonResponse({ error: '評分必須為 1-5 的整數' }, 400);
  }

  // IP 去重檢查。
  const ip =
    request.headers.get('CF-Connecting-IP') ||
    request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
    'unknown';

  const salt = env.IP_SALT ?? 'ratewise-default-salt';
  const ipHash = await hashIp(ip, salt);
  const voteKey = `vote_${ipHash}`;

  const existingVote = await kv.get(voteKey);
  if (existingVote !== null) {
    return jsonResponse({ error: '您已在近 30 天內評分過', alreadyVoted: true }, 409);
  }

  // 寫入評分與 IP 標記（原子性：先讀後寫，KV 無事務，接受極低機率的 race）。
  const [sumStr, countStr] = await Promise.all([kv.get('rating_sum'), kv.get('rating_count')]);

  const newSum = parseFloat(sumStr ?? '0') + rating;
  const newCount = parseInt(countStr ?? '0', 10) + 1;

  await Promise.all([
    kv.put('rating_sum', String(newSum)),
    kv.put('rating_count', String(newCount)),
    kv.put(voteKey, '1', { expirationTtl: VOTE_TTL_SECONDS }),
  ]);

  const ratingValue = Math.round((newSum / newCount) * 10) / 10;

  return jsonResponse({ success: true, ratingValue, ratingCount: newCount });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 只處理 /ratewise/api/ratings 路徑。
    if (!url.pathname.startsWith('/ratewise/api/ratings')) {
      return new Response('Not Found', { status: 404 });
    }

    if (request.method === 'OPTIONS') {
      return corsPreflightResponse();
    }

    const kv = env.RATINGS_KV;
    if (!kv) {
      return jsonResponse({ error: 'KV 未設定' }, 500);
    }

    if (request.method === 'GET') {
      return handleGet(kv);
    }

    if (request.method === 'POST') {
      return handlePost(request, kv, env);
    }

    return jsonResponse({ error: '不支援的請求方法' }, 405);
  },
};
