// src/app/api/indices/route.js
import { NextResponse } from 'next/server';
import axios from 'axios';
import NodeCache from 'node-cache';

// 캐시 설정: 5분 동안 데이터 캐싱
const cache = new NodeCache({ stdTTL: 60 * 5 });

/*
  Alpha Vantage API:
  GET https://www.alphavantage.co/query
    ?function=TIME_SERIES_DAILY
    &symbol=SPY
    &apikey=YOUR_KEY

  symbol:
    SPY -> S&P 500 ETF
    QQQ -> NASDAQ ETF
    DIA -> DOW ETF
*/

export async function GET() {
  try {
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
    if (!apiKey) {
      console.error('ALPHA_VANTAGE_API_KEY is missing in .env.local');
      return NextResponse.json({ error: 'API key not found' }, { status: 500 });
    }

    async function fetchDailyData(symbol) {
      const cacheKey = `dailyData_${symbol}`;
      const cachedData = cache.get(cacheKey);
      if (cachedData) {
        console.log(`Using cached data for ${symbol}`);
        return cachedData;
      }

      const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${apiKey}`;
      const { data } = await axios.get(url);

      // API 호출 제한 메시지 확인
      if (data['Note']) {
        console.error(`API 호출 제한 초과:`, data['Note']);
        throw new Error(`API rate limit exceeded for symbol ${symbol}`);
      }

      // 오류 메시지 확인
      if (data['Error Message']) {
        console.error(`API 오류 메시지:`, data['Error Message']);
        throw new Error(`API Error for symbol ${symbol}: ${data['Error Message']}`);
      }

      // 데이터 구조 확인
      if (!data['Time Series (Daily)']) {
        console.error(`Unexpected response structure for symbol ${symbol}:`, data);
        throw new Error(`No Time Series returned for ${symbol}`);
      }

      cache.set(cacheKey, data['Time Series (Daily)']);
      return data['Time Series (Daily)'];
    }

    // API 호출을 순차적으로 수행하여 호출 제한을 피함
    const spyDaily = await fetchDailyData('SPY');
    const qqqDaily = await fetchDailyData('QQQ');
    const diaDaily = await fetchDailyData('DIA');

    // 최근 7거래일 종가만 뽑아서 배열 형태로 반환
    function getLastNCloses(dailyData, days = 7) {
      const dates = Object.keys(dailyData).sort((a, b) => new Date(b) - new Date(a));
      const lastN = dates.slice(0, days);
      return lastN.reverse().map(date => parseFloat(dailyData[date]['4. close']));
    }

    const sp500 = getLastNCloses(spyDaily, 7);
    const nasdaq = getLastNCloses(qqqDaily, 7);
    const dow = getLastNCloses(diaDaily, 7);

    return NextResponse.json({ sp500, nasdaq, dow });
  } catch (error) {
    console.error('Alpha Vantage indices API route error:', error.message);
    return NextResponse.json({ error: 'Failed to fetch index data' }, { status: 500 });
  }
}
