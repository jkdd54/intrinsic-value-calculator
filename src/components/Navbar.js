// src/components/Navbar.js
"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  IconButton, 
  Drawer, 
  List, 
  ListItem, 
  ListItemText, 
  Divider, 
  Box, 
  Container 
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import HomeIcon from '@mui/icons-material/Home';
import AssessmentIcon from '@mui/icons-material/Assessment';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import { usePathname } from 'next/navigation';

const Navbar = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();

  const toggleDrawer = (open) => () => {
    setDrawerOpen(open);
  };

  const menuItems = [
    { text: '내재가치 산출', href: '/', icon: <HomeIcon /> },
    { text: '재무제표 분석', href: '/financial', icon: <AssessmentIcon /> },
    // 추가 메뉴 항목을 여기에 추가할 수 있습니다.
  ];

  return (
    <>
      <AppBar position="fixed" color="primary" elevation={4}>
        <Container maxWidth="lg">
          <Toolbar disableGutters>
            {/* 햄버거 메뉴 아이콘 (모바일용) */}
            <Box sx={{ display: { xs: 'block', md: 'none' }, mr: 2 }}>
              <IconButton
                edge="start"
                color="inherit"
                aria-label="menu"
                onClick={toggleDrawer(true)}
              >
                <MenuIcon />
              </IconButton>
            </Box>
            {/* 로고 또는 브랜드 이름 */}
            <Typography
              variant="h6"
              component="div"
              sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}
            >
              <Link href="/" passHref legacyBehavior>
                <Button color="inherit" sx={{ textTransform: 'none', display: 'flex', alignItems: 'center' }}>
                  <BusinessCenterIcon sx={{ mr: 1 }} />
                  내재가치 계산기
                </Button>
              </Link>
            </Typography>
            {/* 데스크탑용 메뉴 버튼 */}
            <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 2 }}>
              {menuItems.map((item) => (
                <Link key={item.text} href={item.href} passHref legacyBehavior>
                  <Button
                    color="inherit"
                    startIcon={item.icon}
                    sx={{
                      textTransform: 'none',
                      borderBottom: pathname === item.href ? '2px solid #fff' : 'none',
                      '&:hover': {
                        backgroundColor: 'primary.dark',
                      },
                    }}
                  >
                    {item.text}
                  </Button>
                </Link>
              ))}
            </Box>
            {/* 사용자 아이콘 또는 추가 버튼 (필요 시 추가) */}
            {/* <IconButton color="inherit">
              <PeopleIcon />
            </IconButton> */}
          </Toolbar>
        </Container>
      </AppBar>
      {/* 모바일용 드로어 */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={toggleDrawer(false)}
      >
        <Box
          sx={{ width: 250 }}
          role="presentation"
          onClick={toggleDrawer(false)}
          onKeyDown={toggleDrawer(false)}
        >
          <Typography variant="h6" sx={{ m: 2 }}>
            메뉴
          </Typography>
          <Divider />
          <List>
            {menuItems.map((item) => (
              <Link key={item.text} href={item.href} passHref legacyBehavior>
                <ListItem button selected={pathname === item.href}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {item.icon}
                    <ListItemText primary={item.text} sx={{ ml: 2 }} />
                  </Box>
                </ListItem>
              </Link>
            ))}
          </List>
        </Box>
      </Drawer>
    </>
  );
};

export default Navbar;
