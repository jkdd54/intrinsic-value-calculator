// src/app/api/sentiment/route.js
import { NextResponse } from "next/server";
import yahooFinance from "yahoo-finance2";
import axios from "axios";
import { Redis } from "@upstash/redis";

// Node.js 런타임 사용
export const runtime = "nodejs";

// ─── Upstash Redis 클라이언트 ─────────────────────────────
const redis = new Redis({
  url: process.env.VERCEL_KV_URL,
  token: process.env.VERCEL_KV_TOKEN,
});

export async function GET() {
  const today = new Date().toISOString().slice(0, 10);
  const cacheKey = `sentiment:${today}`;

  // 1) Upstash KV에서 오늘자 캐시 확인
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      const data = JSON.parse(cached);
      return NextResponse.json(data);
    }
  } catch (e) {
    console.warn("Upstash 캐시 조회 실패:", e);
    // 계속 진행해서 새로 수집
  }

  // 2) 오늘 데이터 새로 수집
  try {
    // VIX (공포지수)
    const vixSummary = await yahooFinance.quoteSummary("^VIX", { modules: ["price"] });
    const vix = vixSummary.price?.regularMarketPrice ?? null;

    // Fear & Greed Index
    const fngRes = await axios.get("https://api.alternative.me/fng/?limit=1&format=json");
    const fngData = fngRes.data.data?.[0] ?? {};
    const fngValue = fngData.value ?? null;
    const fngText = fngData.value_classification ?? "";

    // 옵션 풋/콜 비율, Short Interest (미구현)
    const putCallRatio = null;
    const shortInterest = null;

    const data = { vix, fngValue, fngText, putCallRatio, shortInterest };

    // 3) Upstash KV에 저장 (만료: 24시간)
    try {
      await redis.set(cacheKey, JSON.stringify(data), { ex: 60 * 60 * 24 });
    } catch (e) {
      console.warn("Upstash 캐시 저장 실패:", e);
    }

    return NextResponse.json(data);
  } catch (e) {
    console.error("❌ /api/sentiment 에러:", e);
    return NextResponse.json(
      { error: "시장 심리 지표를 불러오는 데 실패했습니다." },
      { status: 500 }
    );
  }
}
