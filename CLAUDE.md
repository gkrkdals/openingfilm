# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## 프로젝트 개요

한국 웨딩 영상 업체 "오프닝필름"의 마케팅/예약 사이트. 공개 랜딩 페이지([app/page.tsx](app/page.tsx)) 하나와, 운영자가 사이트 문구·포트폴리오 영상(유튜브 임베드)·고객 후기·예약 신청을 관리하는 어드민 대시보드(`/admin`)로 구성된다. UI 문구는 한국어.

## 명령어

```bash
npm run dev        # 개발 서버 (localhost:3000)
npm run build      # 프로덕션 빌드 (타입 체크 포함)
npm run lint       # eslint (flat config, eslint.config.mjs)
npx prisma generate                 # 스키마 변경 후 클라이언트 재생성
npx prisma db push                  # SQLite DB에 스키마 반영 (이 프로젝트는 마이그레이션 미사용)
node prisma/seed.js                 # 기본 데이터 시딩 (멱등)
```

테스트는 없다. `.env`에 `DATABASE_URL`(SQLite 파일, 예: `prisma/` 기준 `file:./data/dev.db`), `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`가 정의되어 있어야 한다. 선택 변수로 `SHEETS_WEBHOOK_URL`/`SHEETS_WEBHOOK_TOKEN`(구글 시트 예약 연동, [docs/google-sheets-setup.md](docs/google-sheets-setup.md) 참고)이 있으며, 비어 있으면 시트 전송은 건너뛴다.

## 아키텍처

**스택**: Next.js 16 App Router(AGENTS.md 경고 참고 — Next 관련 코드를 작성하기 전에 `node_modules/next/dist/docs/`를 먼저 읽을 것), React 19, Tailwind 4, Prisma 5 + SQLite. `@supabase/*` 의존성은 잔재물이며 어디에서도 사용되지 않는다.

**데이터 흐름**: [app/page.tsx](app/page.tsx)는 `dynamic = "force-dynamic"`이 설정된 서버 컴포넌트로, Prisma를 직접 조회해(SiteContent key/value 쌍, Portfolio, Review) `app/components/`의 섹션 컴포넌트들에 props로 넘긴다. DB가 비어 있거나 접근 불가하면 하드코딩된 `DEFAULT_CONTENT` 맵으로 폴백하는데, 동일한 기본값이 [prisma/seed.js](prisma/seed.js)에도 중복 정의되어 있으므로 둘을 항상 동기화할 것. 네이밍 변환에 주의: Prisma 필드는 camelCase(`youtubeId`)지만 컴포넌트 props는 snake_case(`youtube_id`)이며, page.tsx에서 매핑한다.

**인증** (라이브러리 없이 직접 구현):
- [utils/auth.ts](utils/auth.ts) — Web Crypto만 사용해 직접 구현한 HMAC-SHA256 JWT. Edge 런타임(미들웨어)과 Node 양쪽에서 동작해야 하므로, 이 파일이나 미들웨어가 사용하는 코드에는 Node 내장 모듈(`crypto` 등)을 **절대** import하지 말 것.
- [utils/password.ts](utils/password.ts) — PBKDF2 해싱, Node 전용, API 라우트에서 사용.
- [middleware.ts](middleware.ts)가 `admin-session` httpOnly 쿠키로 `/admin/*` 접근을 제어하고, 모든 `app/api/admin/*` 라우트도 각자 토큰을 다시 검증한다.
- 최초 로그인 부트스트랩: AdminUser 테이블이 비어 있을 때 [app/api/auth/login/route.ts](app/api/auth/login/route.ts)가 `ADMIN_EMAIL`/`ADMIN_PASSWORD` 환경변수로 관리자 계정을 자동 생성한다. 회원가입 플로우는 없다.

**어드민 대시보드**: [app/admin/page.tsx](app/admin/page.tsx)는 약 900줄짜리 단일 클라이언트 컴포넌트로, 모든 탭(문구 편집, dnd-kit 드래그 정렬 및 `/api/admin/portfolio/reorder`를 사용하는 포트폴리오, 후기, 예약)을 포함한다. `app/api/admin/*` 라우트와는 일반 `fetch`로 통신한다.

**공개 API**: `/api/reservation`(POST)이 유일한 비인증 쓰기 엔드포인트 — 랜딩 페이지의 예약 신청 폼이 사용한다. 예약 저장 후 `next/server`의 `after()`로 구글 스프레드시트 Apps Script 웹훅에도 전송한다(단방향, 실패 무시 — DB가 원본). 기존 데이터 일괄 이관은 `node scripts/export-reservations.js`(일회성).

## 배포

Docker 기반(next.config.ts의 `output: "standalone"`). main 푸시 시 [.github/workflows/deploy.yml](.github/workflows/deploy.yml)이 이미지를 빌드해 서버에 배포하며, **프로덕션 `.env`는 배포할 때마다 GitHub Actions Secrets 값으로 재생성**되므로 새 환경변수는 deploy.yml의 echo 목록과 저장소 Secrets에 함께 추가해야 한다. [entrypoint.sh](entrypoint.sh)가 **컨테이너가 시작될 때마다** `prisma db push --accept-data-loss`와 시드 스크립트를 실행한 뒤 `node server.js`를 기동한다. SQLite 파일은 호스트 볼륨(`/app/prisma/data`, docker-compose.yml 참고)에 마운트되므로 스키마 변경은 자동 배포되지만, 파괴적인 스키마 변경은 프로덕션 데이터를 날릴 수 있다 — seed.js가 비어 있는 테이블만 채우는 이유다.
