// src/app/api/economic/route.js

import { NextResponse } from "next/server";
import axios from "axios";
import { Redis } from "@upstash/redis";

// Node.js 런타임 사용
export const runtime = "nodejs";

// Upstash Redis 클라이언트 초기화
const redis = new Redis({
  url: process.env.VERCEL_KV_URL,
  token: process.env.VERCEL_KV_TOKEN,
});

export async function GET() {
  const apiKey = process.env.FMP_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "FMP_API_KEY가 설정되어 있지 않습니다." },
      { status: 500 }
    );
  }

  // 오늘 날짜 (YYYY-MM-DD)
  const today = new Date().toISOString().slice(0, 10);
  const cacheKey = `economic:${today}`;

  // ❶ Upstash KV에서 오늘자 캐시 확인
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      const data = JSON.parse(cached);
      return NextResponse.json(data);
    }
  } catch (e) {
    console.warn("캐시 조회/파싱 실패, 새로 조회합니다:", e);
  }

  // ❷ 전일 ~ 내일 날짜 계산
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);

  const formatISO = (d) => d.toISOString().slice(0, 10);
  const from = formatISO(yesterday);
  const to = formatISO(tomorrow);

  const url = `https://financialmodelingprep.com/api/v4/economic_calendar?from=${from}&to=${to}&apikey=${apiKey}`;

  try {
    // ❸ 외부 API 호출
    const { data } = await axios.get(url);

    // ❹ 결과를 Upstash KV에 24시간 만료로 저장
    try {
      await redis.set(cacheKey, JSON.stringify(data), {
        ex: 60 * 60 * 24,
      });
    } catch (e) {
      console.warn("캐시 저장 실패:", e);
    }

    return NextResponse.json(data);
  } catch (e) {
    console.error("❌ /api/economic 에러:", e);
    return NextResponse.json(
      { error: "경제 일정 조회에 실패했습니다." },
      { status: 500 }
    );
  }
}
