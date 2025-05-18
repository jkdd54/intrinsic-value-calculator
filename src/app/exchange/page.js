"use client";

import React, { useState } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

// ★ Alpha Vantage API 키를 여기에 넣거나 환경변수로 관리하세요.
const API_KEY = "VP64LCBXTKO4SBBI";

export default function Page() {
  const [baseCurrency, setBaseCurrency] = useState('');
  const [targetCurrency, setTargetCurrency] = useState('');
  const [exchangeRate, setExchangeRate] = useState(null);

  const handleCalculate = async () => {
    if (!baseCurrency || !targetCurrency) {
      alert('기준 통화와 대상 통화를 모두 입력하세요.');
      return;
    }

    try {
      // Alpha Vantage의 CURRENCY_EXCHANGE_RATE 엔드포인트를 사용합니다.
      const url = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${baseCurrency}&to_currency=${targetCurrency}&apikey=${API_KEY}`;
      
      const res = await fetch(url);
      const data = await res.json();
      
      // 응답에서 "Realtime Currency Exchange Rate" 객체를 가져옵니다.
      const exchangeData = data["Realtime Currency Exchange Rate"];
      
      if (exchangeData) {
        // "5. Exchange Rate" 필드에서 환율 값을 파싱합니다.
        const rate = parseFloat(exchangeData["5. Exchange Rate"]);
        setExchangeRate(rate);
      } else {
        alert('환율 정보를 가져오지 못했습니다. 통화 코드를 확인하세요.');
        setExchangeRate(null);
      }
    } catch (error) {
      console.error("환율 정보를 가져오는 중 오류 발생:", error);
      alert('환율 정보를 가져오는 중 오류가 발생했습니다.');
      setExchangeRate(null);
    }
  };

  return (
    <Box sx={{ padding: 2 }}>
      <Typography variant="h4" gutterBottom>
        환율 계산기
      </Typography>

      <Box
        component="form"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          maxWidth: 300,
        }}
        noValidate
        autoComplete="off"
      >
        <TextField
          label="기준 통화 (예: USD)"
          variant="outlined"
          value={baseCurrency}
          onChange={(e) => setBaseCurrency(e.target.value.toUpperCase())}
        />

        <TextField
          label="대상 통화 (예: KRW)"
          variant="outlined"
          value={targetCurrency}
          onChange={(e) => setTargetCurrency(e.target.value.toUpperCase())}
        />

        <Button variant="contained" onClick={handleCalculate}>
          환율 계산
        </Button>

        {exchangeRate !== null && (
          <Typography variant="h6">
            1 {baseCurrency} = {exchangeRate.toFixed(4)} {targetCurrency}
          </Typography>
        )}
      </Box>
    </Box>
  );
}
