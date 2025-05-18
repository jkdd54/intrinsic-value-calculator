// src/app/api/financial/route.js

import axios from 'axios';
import { TranslationServiceClient } from '@google-cloud/translate';
import { NextResponse } from 'next/server';

/**
 * 텍스트를 한국어로 번역하는 함수
 * @param {string} text - 번역할 텍스트
 * @returns {Promise<string>}
 */
const translateTextToKorean = async (text) => {
  try {
    const credentialsJSON = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
    if (!credentialsJSON) {
      console.warn('GOOGLE_APPLICATION_CREDENTIALS_JSON 환경 변수가 설정되지 않았습니다.');
      return text;
    }
    const credentials = JSON.parse(credentialsJSON);
    const translationClient = new TranslationServiceClient({
      credentials: {
        client_email: credentials.client_email,
        private_key: credentials.private_key,
      },
    });
    const request = {
      parent: `projects/${credentials.project_id}/locations/global`,
      contents: [text],
      mimeType: 'text/plain',
      sourceLanguageCode: 'en',
      targetLanguageCode: 'ko',
    };
    const [response] = await translationClient.translateText(request);
    if (response.translations.length > 0) {
      return response.translations[0].translatedText;
    }
    return text;
  } catch (error) {
    console.error('번역 오류:', error);
    return text;
  }
};

/**
 * 투자 등급 산출 함수
 * @param {{currentRatio:number, debtToEquity:number, returnOnAssets:number, returnOnEquity:number}} ratios
 * @returns {string}
 */
const calculateInvestmentGrade = ({ currentRatio, debtToEquity, returnOnAssets, returnOnEquity }) => {
  if (currentRatio >= 2.0 && debtToEquity <= 0.5 && returnOnAssets >= 15 && returnOnEquity >= 20) return 'AAA';
  if (currentRatio >= 1.8 && debtToEquity <= 0.7 && returnOnAssets >= 13 && returnOnEquity >= 18) return 'AA';
  if (currentRatio >= 1.5 && debtToEquity <= 1.0 && returnOnAssets >= 10 && returnOnEquity >= 15) return 'A';
  if (currentRatio >= 1.2 && debtToEquity <= 1.5 && returnOnAssets >= 8  && returnOnEquity >= 12) return 'BBB';
  if (currentRatio >= 1.0 && debtToEquity <= 2.0 && returnOnAssets >= 6  && returnOnEquity >= 10) return 'BB';
  if (currentRatio >= 0.8 && debtToEquity <= 2.5 && returnOnAssets >= 4  && returnOnEquity >= 8)  return 'B';
  if (currentRatio >= 0.5 && debtToEquity <= 3.0 && returnOnAssets >= 2  && returnOnEquity >= 5)  return 'CCC';
  if (currentRatio >= 0.3 && debtToEquity <= 4.0 && returnOnAssets >= 0  && returnOnEquity >= 2)  return 'CC';
  if (currentRatio >= 0.1 && debtToEquity <= 5.0 && returnOnAssets >= -5 && returnOnEquity >= 0)  return 'C';
  return 'D';
};

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');
  const apiKey = process.env.FMP_API_KEY;

  if (!symbol) {
    return NextResponse.json({ error: '티커를 입력하세요.' }, { status: 400 });
  }
  if (!apiKey) {
    console.error('FMP_API_KEY 환경 변수가 설정되지 않았습니다.');
    return NextResponse.json({ error: '서버 설정 오류입니다.' }, { status: 500 });
  }

  try {
    // 1) 병렬 API 요청
    const [
      incomeStatementRes,
      balanceSheetRes,
      cashFlowRes,
      profileRes
    ] = await Promise.all([
      axios.get(`https://financialmodelingprep.com/api/v3/income-statement/${symbol}?limit=5&apikey=${apiKey}`),
      axios.get(`https://financialmodelingprep.com/api/v3/balance-sheet-statement/${symbol}?limit=5&apikey=${apiKey}`),
      axios.get(`https://financialmodelingprep.com/api/v3/cash-flow-statement/${symbol}?limit=5&apikey=${apiKey}`),
      axios.get(`https://financialmodelingprep.com/api/v3/profile/${symbol}?apikey=${apiKey}`),
    ]);

    const incomeStatementData = incomeStatementRes.data;
    const balanceSheetData    = balanceSheetRes.data;
    const cashFlowData        = cashFlowRes.data;
    const profileData         = profileRes.data;

    // 2) 유효성 검사
    if (!incomeStatementData.length) return NextResponse.json({ error: 'Income Statement 데이터 없음' }, { status: 404 });
    if (!balanceSheetData.length)    return NextResponse.json({ error: 'Balance Sheet 데이터 없음' },    { status: 404 });
    if (!cashFlowData.length)        return NextResponse.json({ error: 'Cash Flow 데이터 없음' },        { status: 404 });
    if (!profileData.length)         return NextResponse.json({ error: 'Profile 데이터 없음' },          { status: 404 });

    // 3) 최신 데이터
    const latestIncome  = incomeStatementData[0];
    const latestBalance = balanceSheetData[0];
    const latestCash    = cashFlowData[0];
    const companyProfile = profileData[0];
    const industry       = companyProfile.industry || '';

    // 4) 업종 평균 계산 (미국 상위 50개)
    let industryAverages = { currentRatio: 0, debtToEquity: 0, returnOnAssets: 0, returnOnEquity: 0 };
    if (industry) {
      const peersRes = await axios.get(
        `https://financialmodelingprep.com/api/v3/stock-screener?exchange=NYSE,NASDAQ` +
        `&industry=${encodeURIComponent(industry)}&limit=50&apikey=${apiKey}`
      );
      const symbols = peersRes.data.map(c => c.symbol).join(',');
      const ratiosRes = await axios.get(
        `https://financialmodelingprep.com/api/v3/ratios-ttm/${symbols}?limit=1&apikey=${apiKey}`
      );
      const valid = ratiosRes.data.filter(r =>
        r.currentRatio && r.debtToEquity && r.returnOnAssets && r.returnOnEquity
      );
      industryAverages = valid.reduce((acc, cur, idx, arr) => {
        acc.currentRatio   += +cur.currentRatio;
        acc.debtToEquity   += +cur.debtToEquity;
        acc.returnOnAssets += +cur.returnOnAssets  * 100;
        acc.returnOnEquity += +cur.returnOnEquity  * 100;
        if (idx === arr.length - 1) {
          acc.currentRatio   /= arr.length;
          acc.debtToEquity   /= arr.length;
          acc.returnOnAssets /= arr.length;
          acc.returnOnEquity /= arr.length;
        }
        return acc;
      }, industryAverages);
    }

    // 5) 비율 계산
    const currentRatio   = latestBalance.totalCurrentAssets  / latestBalance.totalCurrentLiabilities;
    const debtToEquity   = latestBalance.totalLiabilities    / latestBalance.totalStockholdersEquity;
    const returnOnAssets = latestIncome.netIncome            / latestBalance.totalAssets;
    const returnOnEquity = latestIncome.netIncome            / latestBalance.totalStockholdersEquity;

    const financialRatios = {
      currentRatio,
      debtToEquity,
      returnOnAssets: returnOnAssets * 100,
      returnOnEquity: returnOnEquity * 100,
    };

    const investmentGrade = calculateInvestmentGrade(financialRatios);

    // 6) 회사 설명 번역
    let description = companyProfile.description || '설명 없음';
    if (companyProfile.description) {
      description = await translateTextToKorean(companyProfile.description);
    }

    // 7) 응답 조립
    const result = {
      symbol:         companyProfile.symbol,
      companyName:    companyProfile.companyName,
      description,
      incomeStatement: {
        revenue:         latestIncome.revenue,
        grossProfit:     latestIncome.grossProfit,
        operatingIncome: latestIncome.operatingIncome,
        netIncome:       latestIncome.netIncome,
      },
      balanceSheet: {
        totalAssets:       latestBalance.totalAssets,
        totalLiabilities:  latestBalance.totalLiabilities,
        totalEquity:       latestBalance.totalStockholdersEquity,
      },
      cashFlow: {
        operatingCashFlow: latestCash.operatingCashFlow,
        investingCashFlow: latestCash.capitalExpenditure,
        financingCashFlow: latestCash.financingCashFlow,
        freeCashFlow:      latestCash.freeCashFlow,
      },
      industryAverages,
      ratios: financialRatios,
      investmentGrade,
    };

    return NextResponse.json({ financials: result }, { status: 200 });
  } catch (err) {
    console.error('API 오류:', err);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
