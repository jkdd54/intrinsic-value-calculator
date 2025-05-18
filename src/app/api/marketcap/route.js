// src/app/api/marketcap/route.js
import { NextResponse } from 'next/server';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

// Node.js 런타임에서 실행되어야 파일시스템 접근이 가능
export const runtime = 'nodejs';

// 캐시 파일 경로
const CACHE_FILE = path.join(process.cwd(), 'marketcapCache.json');
// 하루 단위 비교를 위해 YYYY-MM-DD만 추출
const today = () => new Date().toISOString().slice(0, 10);

export async function GET() {
  // 1) 캐시 읽기
  try {
    const raw = await fs.promises.readFile(CACHE_FILE, 'utf-8');
    const cache = JSON.parse(raw);
    if (cache.timestamp === today()) {
      // 오늘자 캐시가 있으면 바로 반환
      return NextResponse.json(cache.data);
    }
  } catch {
    // 파일이 없거나 파싱 오류 시 무시하고 새로 호출
  }

  // 2) 캐시가 없거나 날짜가 다르면 실제 API 호출
  const apiKey = process.env.FMP_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'API key not found' }, { status: 500 });
  }

  try {
    const limit = 100;
    const fetchLimit = 500;
    const url = `https://financialmodelingprep.com/api/v3/stock-screener?limit=${fetchLimit}&exchange=NYSE,NASDAQ&sort=marketCap&order=desc&apikey=${apiKey}`;
    const response = await axios.get(url);
    const data = response.data;

    // 중복 제거 & ETF, 펀드 제외
    const unique = [];
    const seen = new Set();
    for (const comp of data) {
      if (comp.isEtf || comp.isFund) continue;
      if (!seen.has(comp.companyName)) {
        seen.add(comp.companyName);
        unique.push(comp);
        if (unique.length === limit) break;
      }
    }

    // 3) 캐시에 저장
    const toCache = {
      timestamp: today(),
      data: unique
    };
    try {
      await fs.promises.writeFile(CACHE_FILE, JSON.stringify(toCache), 'utf-8');
    } catch (e) {
      console.warn('marketcapCache.json write failed:', e);
    }

    // 4) 최종 응답
    return NextResponse.json(unique);
  } catch (error) {
    console.error('Error fetching marketcap data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch market cap data' },
      { status: 500 }
    );
  }
}
