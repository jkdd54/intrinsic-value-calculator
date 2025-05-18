// src/app/api/summary/route.js
import { NextResponse } from "next/server";
import OpenAI from "openai";
import yahooFinance from "yahoo-finance2";
import { Redis } from "@upstash/redis";

// Node.js 런타임 사용
export const runtime = "nodejs";

// ─── 분류별 티커 정의 ─────────────────────────────────────────
const TICKER_GROUPS = {
  "🇺🇸 미국증시": { 다우: "^DJI", "S&P500": "^GSPC", 나스닥: "^IXIC" },
  "🌍 글로벌지수": { 니케이225: "^N225", FTSE100: "^FTSE", 코스피: "^KS11" },
  "💱 환율": { "USD/KRW": "KRW=X", "USD/JPY": "JPY=X", "EUR/USD": "EURUSD=X" },
  "🛢️ 원자재": { WTI유: "CL=F", 금: "GC=F" },
  "₿ 디지털자산": { 비트코인: "BTC-USD", 이더리움: "ETH-USD" },
};

// ─── OpenAI 인스턴스 ───────────────────────────────────────
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ─── Upstash Redis 클라이언트 ─────────────────────────────
const redis = new Redis({
  url: process.env.VERCEL_KV_URL,
  token: process.env.VERCEL_KV_TOKEN,
});

export async function GET() {
  const today = new Date().toISOString().slice(0, 10);
  const cacheKey = `summary:${today}`;

  // ❶ KV에서 오늘자 캐시 확인
  const cached = await redis.get(cacheKey);
  if (cached) {
    let parsed;
    if (typeof cached === "string") {
      try {
        parsed = JSON.parse(cached);
      } catch {
        // 파싱 실패 시 원본을 그대로 쓰자
        parsed = cached;
      }
    } else {
      parsed = cached;
    }
    const { data, summaries } = parsed;
    return NextResponse.json({ data, summaries });
  }

  // ❷ 오늘 데이터 새로 수집
  const data = {};
  const summaries = {};

  for (const [groupName, tickers] of Object.entries(TICKER_GROUPS)) {
    // 2-1) 등락률 수집
    const groupData = {};
    for (const [label, symbol] of Object.entries(tickers)) {
      try {
        const quote = await yahooFinance.quote(symbol);
        const ch = quote.regularMarketChangePercent;
        groupData[label] =
          typeof ch === "number" ? parseFloat(ch.toFixed(2)) : null;
      } catch {
        groupData[label] = null;
      }
    }
    data[groupName] = groupData;

    // 2-2) GPT 요약
    const valid = Object.entries(groupData).filter(([, pct]) => pct != null);
    if (valid.length === 0) {
      summaries[groupName] = "데이터가 없어 요약할 수 없습니다.";
    } else {
      const lines = valid.map(([l, pct]) => `${l}: ${pct}%`).join("\n");
      const prompt =
        `${groupName} 지수 변동률:\n${lines}\n\n위 내용을 전문가 시각으로 간결하게 해석해줘.`;
      try {
        const resp = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            { role: "system", content: "당신은 경제 애널리스트입니다." },
            { role: "user", content: prompt },
          ],
          temperature: 0.7,
        });
        summaries[groupName] = resp.choices[0].message.content.trim();
      } catch (e) {
        if (e.code === "insufficient_quota") {
          summaries[groupName] = "요약 불가: 쿼터가 부족합니다.";
        } else {
          console.error("GPT 요약 에러:", e);
          summaries[groupName] = "요약 실패: 잠시 후 다시 시도해주세요.";
        }
      }
    }
  }

  // ❸ KV에 저장 (만료: 24시간)
  await redis.set(
    cacheKey,
    JSON.stringify({ data, summaries }),
    { ex: 60 * 60 * 24 }
  );

  return NextResponse.json({ data, summaries });
}
