// src/app/api/news/route.js
import { NextResponse } from "next/server";
import Parser from "rss-parser";
import { Redis } from "@upstash/redis";

export const runtime = "nodejs";
const parser = new Parser();

// Upstash Redis 클라이언트
const redis = new Redis({
  url: process.env.VERCEL_KV_URL,
  token: process.env.VERCEL_KV_TOKEN,
});

export async function GET() {
  const today = new Date().toISOString().slice(0, 10);
  const cacheKey = `news:${today}`;

  // 1) Upstash에서 오늘자 캐시 확인
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      const headlines = JSON.parse(cached);
      return NextResponse.json({ headlines });
    }
  } catch (e) {
    console.warn("캐시 조회 오류, 새로 호출을 진행합니다.", e);
  }

  // 2) RSS 파싱하여 최신 경제 뉴스 5건 가져오기
  try {
    const feed = await parser.parseURL(
      "https://news.google.com/rss/search?" +
        "q=%EC%A0%9C%EA%B3%84&" + // q=경제
        "hl=ko&gl=KR&ceid=KR:ko"
    );
    const headlines = feed.items.slice(0, 5).map((item) => ({
      title: item.title,
      url: item.link,
    }));

    // 3) Upstash에 캐시 저장 (24시간 만료)
    try {
      await redis.set(cacheKey, JSON.stringify(headlines), { ex: 60 * 60 * 24 });
    } catch (e) {
      console.warn("캐시 저장 실패:", e);
    }

    return NextResponse.json({ headlines });
  } catch (e) {
    console.error("❌ /api/news 에러:", e);
    return NextResponse.json(
      { error: "경제 뉴스 헤드라인을 불러오는 데 실패했습니다." },
      { status: 500 }
    );
  }
}
