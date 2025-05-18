// src/app/intrinsic/page.js
"use client";

import React, { useState } from 'react';
import axios from 'axios';
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
  Card,
  CardContent,
  Stack,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CalculateIcon from '@mui/icons-material/Calculate';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

export default function IntrinsicValuePage() {
  const [symbol, setSymbol] = useState('');
  const [intrinsicValue, setIntrinsicValue] = useState(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const calculateIntrinsicValue = async (e) => {
    e.preventDefault();
    setMessage('');
    setIntrinsicValue(null);

    if (!symbol.trim()) {
      setMessage('티커를 입력하세요.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.get(`/api/calculate?symbol=${symbol}`);
      setIntrinsicValue(response.data.intrinsicValue);
    } catch (error) {
      console.error('서버에서 오류 발생:', error);
      if (error.response) {
        setMessage(error.response.data.error || '서버에서 오류가 발생했습니다.');
      } else if (error.request) {
        setMessage('서버로부터 응답을 받지 못했습니다.');
      } else {
        setMessage('알 수 없는 오류가 발생했습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Card sx={{ boxShadow: 3, borderRadius: 2 }}>
        <CardContent>
          <Stack spacing={3}>
            <Typography variant="h4" component="h1" align="center">
              내재가치 계산기 <CalculateIcon fontSize="large" color="primary" />
            </Typography>

            {/* 엔터키 제출을 위한 form 태그 */}
            <form onSubmit={calculateIntrinsicValue}>
              <TextField
                label="티커 입력 (예: AAPL)"
                variant="outlined"
                fullWidth
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                disabled={isLoading}
                helperText="대문자로 입력해주세요."
              />

              <Box sx={{ position: 'relative', mt: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  type="submit"
                  startIcon={<CalculateIcon />}
                  disabled={isLoading || !symbol.trim()}
                >
                  계산하기
                </Button>
                {isLoading && (
                  <CircularProgress
                    size={24}
                    sx={{
                      color: 'primary.main',
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                    }}
                  />
                )}
              </Box>
            </form>

            {intrinsicValue !== null && (
              <Alert
                icon={<CheckCircleIcon fontSize="inherit" />}
                severity="success"
              >
                내재가치: ${intrinsicValue}
              </Alert>
            )}

            {message && (
              <Alert severity="error">{message}</Alert>
            )}

            <Accordion>
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
                      <strong>자유 현금 흐름(FCF) 계산:</strong> FCF = 운영 현금 흐름 - 자본적 지출
                    </li>
                    <li>
                      <strong>성장률 산출:</strong> 최근 FCF 성장률 평균을 기반으로 향후 5년 FCF 예측
                    </li>
                    <li>
                      <strong>현재 가치 계산:</strong> 할인율을 적용해 미래 FCF를 현재 가치로 할인
                    </li>
                    <li>
                      <strong>잔존가치 계산:</strong> 향후 5년 이후 FCF를 지속 성장 모델로 계산
                    </li>
                    <li>
                      <strong>기업 가치 계산:</strong> 할인된 FCF와 잔존가치를 합산
                    </li>
                    <li>
                      <strong>주주 지분 가치 계산:</strong> 기업 가치에서 부채를 차감하고 현금을 추가
                    </li>
                    <li>
                      <strong>주당 내재가치 계산:</strong> 주주 지분 가치를 발행 주식 수로 나눔
                    </li>
                  </ol>
                </Typography>
              </AccordionDetails>
            </Accordion>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
}
