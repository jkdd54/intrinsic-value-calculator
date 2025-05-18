/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://www.finvalu.site', // 실제 배포된 도메인으로 변경
  generateRobotsTxt: true,          // robots.txt 파일 생성
  sitemapSize: 7000,                // 하나의 사이트맵에 포함될 최대 URL 수 (기본값: 5000)
  changefreq: 'daily',              // 페이지 업데이트 빈도
  priority: 0.7,                    // 페이지 우선순위 (기본값: 1.0)
};
