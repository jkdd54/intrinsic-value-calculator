// app/api/calculate/route.js
import axios from 'axios';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');
  const apiKey = process.env.FMP_API_KEY;

  // API 키 확인을 위한 로그 추가
  console.log('API Key:', apiKey);

  if (!symbol) {
    return new Response(JSON.stringify({ error: '티커를 입력하세요.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!apiKey) {
    console.error('API 키가 설정되지 않았습니다.');
    return new Response(JSON.stringify({ error: '서버 설정 오류입니다.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const cashFlowUrl = `https://financialmodelingprep.com/api/v3/cash-flow-statement/${symbol}?limit=5&apikey=${apiKey}`;
    const balanceSheetUrl = `https://financialmodelingprep.com/api/v3/balance-sheet-statement/${symbol}?limit=1&apikey=${apiKey}`;
    const profileUrl = `https://financialmodelingprep.com/api/v3/profile/${symbol}?apikey=${apiKey}`;

    // URL 로그 추가
    console.log('Cash Flow URL:', cashFlowUrl);
    console.log('Balance Sheet URL:', balanceSheetUrl);
    console.log('Profile URL:', profileUrl);

    // 병렬로 API 요청 수행
    const [cashFlowResponse, balanceSheetResponse, profileResponse] = await Promise.all([
      axios.get(cashFlowUrl),
      axios.get(balanceSheetUrl),
      axios.get(profileUrl),
    ]);

    console.log('Cash Flow Response Status:', cashFlowResponse.status);
    console.log('Balance Sheet Response Status:', balanceSheetResponse.status);
    console.log('Profile Response Status:', profileResponse.status);

    const cashFlowData = cashFlowResponse.data;
    const balanceSheetData = balanceSheetResponse.data;
    const profileData = profileResponse.data;

    // 응답 데이터 로그 추가
    console.log('Cash Flow Data:', cashFlowData);
    console.log('Balance Sheet Data:', balanceSheetData);
    console.log('Profile Data:', profileData);

    // 데이터 존재 여부 확인
    if (!Array.isArray(cashFlowData) || cashFlowData.length === 0) {
      return new Response(JSON.stringify({ error: 'Cash Flow 데이터를 가져올 수 없습니다.' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!Array.isArray(balanceSheetData) || balanceSheetData.length === 0) {
      return new Response(JSON.stringify({ error: 'Balance Sheet 데이터를 가져올 수 없습니다.' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!Array.isArray(profileData) || profileData.length === 0) {
      return new Response(JSON.stringify({ error: 'Profile 데이터를 가져올 수 없습니다.' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 자유 현금 흐름 계산
    const recentCashFlows = cashFlowData.slice(0, 4);
    const fcfList = recentCashFlows.map((report, index) => {
      const operatingCashFlow = parseFloat(report.operatingCashFlow) || 0;
      const capitalExpenditure = parseFloat(report.capitalExpenditure) || 0;
      console.log(`FCF 계산 - Report ${index + 1}: ${operatingCashFlow} - ${capitalExpenditure} = ${operatingCashFlow - capitalExpenditure}`);
      return operatingCashFlow - capitalExpenditure;
    });

    // 성장률 계산 (일반적인 성장률 계산 방식)
    const growthRates = [];
    for (let i = 1; i < fcfList.length; i++) {
      if (fcfList[i - 1] !== 0) { // 0으로 나누는 것을 방지
        const growthRate = (fcfList[i] - fcfList[i - 1]) / fcfList[i - 1];
        growthRates.push(growthRate);
      } else {
        console.warn(`성장률 계산 불가 - 이전 FCF가 0입니다. Report ${i}`);
      }
    }

    let averageGrowthRate = 0.05; // 기본값 설정

    if (growthRates.length > 0) {
      averageGrowthRate = growthRates.reduce((a, b) => a + b, 0) / growthRates.length;

      // 평균 성장률이 비현실적인 경우 조정
      if (averageGrowthRate > 0.2 || averageGrowthRate < 0) {
        console.warn(`평균 성장률 (${averageGrowthRate})이 비현실적입니다. 기본 성장률 5%로 조정합니다.`);
        averageGrowthRate = 0.05; // 5%로 조정
      }
    } else {
      console.warn('성장률 계산에 필요한 데이터가 충분하지 않습니다. 기본 성장률 5% 사용.');
    }

    // 향후 5년간 FCF 예측
    const lastFcf = fcfList[fcfList.length - 1];
    const projectedFcf = [];
    for (let i = 1; i <= 5; i++) {
      const projected = lastFcf * Math.pow(1 + averageGrowthRate, i);
      projectedFcf.push(projected);
      console.log(`프로젝트 FCF Year ${i}: ${projected}`);
    }

    // 할인율 및 잔존가치 설정
    const discountRate = 0.08; // 8%
    const terminalGrowthRate = 0.02; // 2%
    const terminalValue = projectedFcf[4] * (1 + terminalGrowthRate) / (discountRate - terminalGrowthRate);
    console.log(`Terminal Value: ${terminalValue}`);

    // 현금 흐름 할인
    const discountedFcf = projectedFcf.map((fcf, index) => {
      const discounted = fcf / Math.pow(1 + discountRate, index + 1);
      console.log(`할인된 FCF Year ${index + 1}: ${discounted}`);
      return discounted;
    });
    const discountedTerminalValue = terminalValue / Math.pow(1 + discountRate, 5);
    console.log(`할인된 Terminal Value: ${discountedTerminalValue}`);

    // 기업 가치 계산
    const enterpriseValue = discountedFcf.reduce((a, b) => a + b, 0) + discountedTerminalValue;
    console.log(`Enterprise Value: ${enterpriseValue}`);

    // 부채 및 현금
    const latestBalanceSheet = balanceSheetData[0];
    const totalDebt =
      (parseFloat(latestBalanceSheet.shortTermDebt) || 0) +
      (parseFloat(latestBalanceSheet.longTermDebt) || 0);
    const cash = parseFloat(latestBalanceSheet.cashAndCashEquivalents) || 0;
    console.log(`Total Debt: ${totalDebt}, Cash: ${cash}`);

    const equityValue = enterpriseValue - totalDebt + cash;
    console.log(`Equity Value: ${equityValue}`);

    // 주식 수 가져오기
    let sharesOutstanding = parseFloat(profileData[0]?.sharesOutstanding);
    if (!sharesOutstanding || isNaN(sharesOutstanding)) {
      // sharesOutstanding이 누락된 경우, mktCap과 price를 사용하여 계산
      const mktCap = parseFloat(profileData[0]?.mktCap);
      const price = parseFloat(profileData[0]?.price);
      if (mktCap && price && price !== 0) {
        sharesOutstanding = mktCap / price;
        console.log(`Calculated Shares Outstanding from mktCap and price: ${sharesOutstanding}`);
      } else {
        sharesOutstanding = NaN;
      }
    }
    console.log(`Shares Outstanding: ${sharesOutstanding}`);

    if (!sharesOutstanding || isNaN(sharesOutstanding)) {
      return new Response(JSON.stringify({ error: '주식 수 정보를 가져올 수 없습니다.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 내재가치 계산
    const intrinsicValuePerShare = equityValue / sharesOutstanding;
    console.log(`Intrinsic Value Per Share: ${intrinsicValuePerShare}`);

    return new Response(JSON.stringify({ intrinsicValue: intrinsicValuePerShare.toFixed(2) }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    if (error.response) {
      // API 요청이 이루어졌고, 서버가 상태 코드로 응답했을 때
      console.error('API 응답 오류:', error.response.data);
      return new Response(JSON.stringify({ error: '외부 API에서 데이터를 가져오는 중 오류가 발생했습니다.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    } else if (error.request) {
      // 요청이 이루어졌으나 응답을 받지 못했을 때
      console.error('응답 없음:', error.request);
      return new Response(JSON.stringify({ error: '외부 API로부터 응답을 받지 못했습니다.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      // 그 외의 오류
      console.error('서버 오류:', error.message);
      return new Response(JSON.stringify({ error: '서버에서 오류가 발생했습니다.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }
}
