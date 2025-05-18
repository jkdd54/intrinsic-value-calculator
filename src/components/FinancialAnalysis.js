// src/components/FinancialAnalysis.js
'use client';

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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SearchIcon from '@mui/icons-material/Search';

const FinancialAnalysis = () => {
  const [symbol, setSymbol] = useState('');
  const [financials, setFinancials] = useState(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchFinancialAnalysis = async () => {
    setMessage('');
    setFinancials(null);
    setIsLoading(true);

    if (!symbol) {
      setMessage('티커를 입력하세요.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.get(`/api/financial?symbol=${symbol.toUpperCase()}`);
      setFinancials(response.data.financials);
      console.log('Financials Data:', response.data.financials); // 디버깅을 위한 로그 추가
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
    <Container maxWidth="md" sx={{ mt: 8 }}>
      <Box
        sx={{
          p: 4,
          boxShadow: 3,
          borderRadius: 2,
          backgroundColor: 'background.paper',
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom align="center">
          재무제표 분석 <SearchIcon fontSize="large" color="primary" />
        </Typography>
        <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
          <TextField
            label="티커 입력 (예: AAPL)"
            variant="outlined"
            fullWidth
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={fetchFinancialAnalysis}
            startIcon={<SearchIcon />}
            disabled={isLoading}
            sx={{ minWidth: '120px' }}
          >
            {isLoading ? <CircularProgress size={24} color="inherit" /> : '분석'}
          </Button>
        </Box>
        {message && (
          <Box sx={{ mt: 2 }}>
            <Alert severity="error">{message}</Alert>
          </Box>
        )}
        {financials && (
          <Box sx={{ mt: 4 }}>
            {/* 회사 프로필 */}
            <Typography variant="h5" gutterBottom>
              {financials.companyName} ({financials.symbol})
            </Typography>
            <Typography variant="body1" gutterBottom>
              산업: {financials.description}
            </Typography>

            {/* 투자 등급 표시 */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6">
                종합 투자 등급: <strong>{financials.investmentGrade}</strong>
              </Typography>
              {/* 등급에 따라 색상 변경 */}
              <Typography variant="body2" color={
                financials.investmentGrade === 'AAA' || financials.investmentGrade === 'AA' || financials.investmentGrade === 'A'
                  ? 'green'
                  : financials.investmentGrade === 'BBB'
                  ? 'orange'
                  : 'red'
              }>
                {financials.investmentGrade === 'AAA' && '매우 우수한 재무 건전성'}
                {financials.investmentGrade === 'AA' && '우수한 재무 건전성'}
                {financials.investmentGrade === 'A' && '양호한 재무 건전성'}
                {financials.investmentGrade === 'BBB' && '보통의 재무 건전성'}
                {financials.investmentGrade === 'BB' && '재무 건전성에 주의가 필요'}
                {financials.investmentGrade === 'B' && '재무 건전성이 매우 취약'}
                {financials.investmentGrade === 'N/A' && '등급을 산출할 수 없습니다'}
              </Typography>
            </Box>

            {/* 간소화된 재무제표 */}
            <Accordion sx={{ mt: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="income-content" id="income-header">
                <Typography>소득 재무제표</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>항목</TableCell>
                        <TableCell align="right">값 (USD)</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell>매출</TableCell>
                        <TableCell align="right">{financials.incomeStatement.revenue?.toLocaleString() || '데이터 없음'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>매출 총이익</TableCell>
                        <TableCell align="right">{financials.incomeStatement.grossProfit?.toLocaleString() || '데이터 없음'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>영업 이익</TableCell>
                        <TableCell align="right">{financials.incomeStatement.operatingIncome?.toLocaleString() || '데이터 없음'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>순이익</TableCell>
                        <TableCell align="right">{financials.incomeStatement.netIncome?.toLocaleString() || '데이터 없음'}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </AccordionDetails>
            </Accordion>

            <Accordion sx={{ mt: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="balance-content" id="balance-header">
                <Typography>대차대조표</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>항목</TableCell>
                        <TableCell align="right">값 (USD)</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell>총 자산</TableCell>
                        <TableCell align="right">{financials.balanceSheet.totalAssets?.toLocaleString() || '데이터 없음'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>총 부채</TableCell>
                        <TableCell align="right">{financials.balanceSheet.totalLiabilities?.toLocaleString() || '데이터 없음'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>총 자본</TableCell>
                        <TableCell align="right">{financials.balanceSheet.totalEquity?.toLocaleString() || '데이터 없음'}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </AccordionDetails>
            </Accordion>

            <Accordion sx={{ mt: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="cashflow-content" id="cashflow-header">
                <Typography>현금 흐름표</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>항목</TableCell>
                        <TableCell align="right">값 (USD)</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell>영업 현금 흐름</TableCell>
                        <TableCell align="right">
                          {financials.cashFlow.operatingCashFlow?.toLocaleString() || '데이터 없음'}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>투자활동 현금흐름 (Investing Cash Flow)</TableCell>
                        <TableCell align="right">
                          {financials.cashFlow.investingCashFlow?.toLocaleString() || '데이터 없음'}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>재무활동 현금흐름 (Financing Cash Flow)</TableCell>
                        <TableCell align="right">
                          {financials.cashFlow.financingCashFlow?.toLocaleString() || '데이터 없음'}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>자유 현금 흐름 (Free Cash Flow)</TableCell>
                        <TableCell align="right">
                          {financials.cashFlow.freeCashFlow?.toLocaleString() || '데이터 없음'}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </AccordionDetails>
            </Accordion>

            {/* 재무 비율 */}
            <Accordion sx={{ mt: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="ratios-content" id="ratios-header">
                <Typography>재무 비율</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>비율</TableCell>
                        <TableCell align="right">값</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell>유동 비율 (Current Ratio)</TableCell>
                        <TableCell align="right">{financials.ratios.currentRatio?.toFixed(2) || 'N/A'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>부채 비율 (Debt to Equity)</TableCell>
                        <TableCell align="right">{financials.ratios.debtToEquity?.toFixed(2) || 'N/A'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>총자산 수익률 (ROA)</TableCell>
                        <TableCell align="right">{financials.ratios.returnOnAssets?.toFixed(2)}%</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>자기자본 수익률 (ROE)</TableCell>
                        <TableCell align="right">{financials.ratios.returnOnEquity?.toFixed(2)}%</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </AccordionDetails>
            </Accordion>

            {/* 간단한 분석 */}
            <Accordion sx={{ mt: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="analysis-content" id="analysis-header">
                <Typography>분석 결과</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body1">
                  <strong>유동 비율 (Current Ratio)</strong>: {financials.ratios.currentRatio?.toFixed(2) || 'N/A'} <br />
                  유동 비율은 기업의 단기 채무 상환 능력을 나타냅니다. 1 이상이면 단기 채무를 충분히 상환할 수 있음을 의미합니다.
                </Typography>
                <Typography variant="body1" sx={{ mt: 2 }}>
                  <strong>부채 비율 (Debt to Equity)</strong>: {financials.ratios.debtToEquity?.toFixed(2) || 'N/A'} <br />
                  부채 비율은 기업의 재무 건전성을 나타내며, 낮을수록 안정적입니다.
                </Typography>
                <Typography variant="body1" sx={{ mt: 2 }}>
                  <strong>총자산 수익률 (ROA)</strong>: {financials.ratios.returnOnAssets?.toFixed(2) || 'N/A'}% <br />
                  ROA는 기업이 자산을 얼마나 효율적으로 활용하여 수익을 창출하는지를 나타냅니다.
                </Typography>
                <Typography variant="body1" sx={{ mt: 2 }}>
                  <strong>자기자본 수익률 (ROE)</strong>: {financials.ratios.returnOnEquity?.toFixed(2) || 'N/A'}% <br />
                  ROE는 주주의 투자 대비 얼마나 효율적으로 수익을 창출했는지를 나타냅니다.
                </Typography>
              </AccordionDetails>
            </Accordion>
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default FinancialAnalysis;
