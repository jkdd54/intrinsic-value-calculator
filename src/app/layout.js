"use client";

import * as React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import AppBar from '@mui/material/AppBar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Link from 'next/link';
import { theme } from '../theme'; // 서버에서 생성한 테마 가져오기

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>내재가치 계산기</title>

        {/* 파비콘 및 아이콘 */}
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body>
        <ThemeProvider theme={theme}>
          <CssBaseline />

          {/* 상단 네비게이션 바 */}
          <AppBar position="fixed" color="primary" elevation={4}>
            <Toolbar
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                flexWrap: 'wrap', // 추가: 모바일에서 줄바꿈 허용
              }}
            >
              {/* 타이틀 */}
              <Typography
                variant="h6"
                sx={{
                  // flexGrow를 제거하거나 축소하여 오른쪽 버튼 그룹에 공간 확보
                  mr: 2,
                  fontSize: {
                    xs: '1rem', // 모바일
                    sm: '1.25rem', // 작은 화면 이상
                  },
                  whiteSpace: 'nowrap', // 텍스트 줄바꿈 방지
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                미국 주식 분석기
              </Typography>

              {/* 네비게이션 버튼 그룹 */}
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  color="inherit"
                  component={Link}
                  href="/"
                  sx={{
                    fontSize: {
                      xs: '0.8rem', // 모바일
                      sm: '1rem', // 작은 화면 이상
                    },
                    whiteSpace: 'nowrap',
                  }}
                >
                  메인화면
                </Button>
                <Button
                  color="inherit"
                  component={Link}
                  href="/intrinsic"
                  sx={{
                    fontSize: {
                      xs: '0.8rem',
                      sm: '1rem',
                    },
                    whiteSpace: 'nowrap',
                  }}
                >
                  내재가치산출
                </Button>
                <Button
                  color="inherit"
                  component={Link}
                  href="/financial"
                  sx={{
                    fontSize: {
                      xs: '0.8rem',
                      sm: '1rem',
                    },
                    whiteSpace: 'nowrap',
                  }}
                >
                  재무제표분석
                </Button>
                {/* 추가된 "환율 계산기" 버튼 */}
                <Button
                  color="inherit"
                  component={Link}
                  href="/exchange"
                  sx={{
                    fontSize: {
                      xs: '0.8rem',
                      sm: '1rem',
                    },
                    whiteSpace: 'nowrap',
                  }}
                >
                  환율 계산기
                </Button>
              </Box>
            </Toolbar>
          </AppBar>

          {/* 상단바 높이만큼 콘텐츠 아래로 밀기 */}
          <Toolbar />

          {/* 메인 컨텐츠 영역 */}
          <Box
            component="main"
            sx={{
              minHeight: 'calc(100vh - 64px)', // AppBar와 푸터 등을 고려한 최소 높이
              background: 'linear-gradient(135deg, #e0f7fa 0%, #ffffff 100%)',
              py: 4,
              px: { xs: 2, sm: 3, md: 4 },
            }}
          >
            {children}
          </Box>

          {/* 푸터 영역 (선택사항) */}
          <Box
            component="footer"
            sx={{
              textAlign: 'center',
              py: 2,
              backgroundColor: theme.palette.grey[200],
            }}
          >
            <Typography variant="body2" color="textSecondary">
              © {new Date().getFullYear()} 미국 주식 분석기. All rights reserved.
            </Typography>
          </Box>
        </ThemeProvider>
      </body>
    </html>
  );
}
