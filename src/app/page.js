// src/app/page.js
"use client";

import axios from 'axios';
import { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Container,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  CircularProgress,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CalculateIcon from '@mui/icons-material/Calculate';

function IntrinsicValueCalculator() {
  const [symbol, setSymbol] = useState('');
  const [intrinsicValue, setIntrinsicValue] = useState(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const calculateIntrinsicValue = async () => {
    setMessage('');
    setIntrinsicValue(null);

    if (!symbol) {
      setMessage('티커를 입력하세요.');
      return;
    }

    try {
      const response = await axios.get(`/api/calculate?symbol=${symbol}`);
      setIntrinsicValue(response.data.intrinsicValue);
    } catch (error) {
      console.error('서버에서 오류 발생:', error);
      if (error.response) {
        // 서버가 4xx 또는 5xx 응답을 반환한 경우
        setMessage(error.response.data.error || '서버에서 오류가 발생했습니다.');
      } else if (error.request) {
        // 요청이 이루어졌으나 응답을 받지 못한 경우
        setMessage('서버로부터 응답을 받지 못했습니다.');
      } else {
        // 그 외의 오류
        setMessage('알 수 없는 오류가 발생했습니다.');
      }
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Box
        sx={{
          p: 4,
          boxShadow: 3,
          borderRadius: 2,
          backgroundColor: 'background.paper',
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom align="center">
          내재가치 계산기 <CalculateIcon fontSize="large" color="primary" />
        </Typography>
        <Box sx={{ mt: 4 }}>
          <TextField
            label="티커 입력 (예: AAPL)"
            variant="outlined"
            fullWidth
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
          />
        </Box>
        <Box sx={{ mt: 2, position: 'relative' }}>
          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={calculateIntrinsicValue}
            startIcon={<CalculateIcon />}
            disabled={isLoading}
          >
            계산
          </Button>
          {isLoading && (
            <CircularProgress
              size={24}
              sx={{
                color: 'primary.main',
                position: 'absolute',
                top: '50%',
                left: '50%',
                marginTop: '-12px',
                marginLeft: '-12px',
              }}
            />
          )}
        </Box>
        {intrinsicValue && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" color="green">
              내재가치: ${intrinsicValue}
            </Typography>
          </Box>
        )}
        {message && (
          <Box sx={{ mt: 2 }}>
            <Alert severity="error">{message}</Alert>
          </Box>
        )}
        <Accordion sx={{ mt: 4 }}>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="calculation-method-content"
            id="calculation-method-header"
          >
            <Typography>내재가치 산출 방식 및 수식 보기</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography component="div">
              <ol>
                <li>
                  <strong>자유 현금 흐름(Free Cash Flow, FCF) 계산:</strong>
                  <br />
                  FCF = 운영 현금 흐름(Operating Cash Flow) - 자본적 지출(Capital Expenditure)
                </li>
                <li>
                  <strong>성장률(Growth Rate) 산출:</strong>
                  <br />
                  최근 몇 년간 FCF의 성장률을 평균하여 향후 5년간의 FCF를 예측합니다.
                </li>
                <li>
                  <strong>현재 가치(Present Value) 계산:</strong>
                  <br />
                  할인율(Discount Rate)을 적용하여 미래의 FCF를 현재 가치로 할인합니다.
                </li>
                <li>
                  <strong>잔존가치(Terminal Value) 계산:</strong>
                  <br />
                  향후 5년 이후의 FCF를 추정하고, 이를 지속 성장 모델을 사용하여 계산합니다.
                  <br />
                  Terminal Value = (FCF₅ × (1 + 잔존 성장률)) / (할인율 - 잔존 성장률)
                </li>
                <li>
                  <strong>기업 가치(Enterprise Value) 계산:</strong>
                  <br />
                  할인된 FCF와 할인된 잔존가치를 합산하여 기업 가치를 산출합니다.
                </li>
                <li>
                  <strong>주주 지분 가치(Equity Value) 계산:</strong>
                  <br />
                  기업 가치에서 부채를 차감하고 현금을 더하여 주주 지분 가치를 계산합니다.
                  <br />
                  Equity Value = Enterprise Value - Total Debt + Cash
                </li>
                <li>
                  <strong>주당 내재가치(Intrinsic Value per Share) 계산:</strong>
                  <br />
                  주주 지분 가치를 발행 주식 수로 나누어 주당 내재가치를 산출합니다.
                  <br />
                  Intrinsic Value per Share = Equity Value / Shares Outstanding
                </li>
              </ol>
            </Typography>
          </AccordionDetails>
        </Accordion>
      </Box>
    </Container>
  );
}

export default IntrinsicValueCalculator;