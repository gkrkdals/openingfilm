#!/bin/sh

# 데이터베이스가 없거나 스키마가 변경되었을 시 자동 업데이트 실행
echo "Running prisma db push..."
npx prisma db push --accept-data-loss

# 초기 기본 데이터 시딩 — 최초 1회만 실행.
# 마커 파일은 영속 볼륨(prisma/data)에 두어, 재배포/재기동 시에도 유지된다.
# 관리자가 카드/후기 등을 전부 삭제해도 다음 배포 때 기본값이 되살아나지 않게 한다.
SEED_MARKER="prisma/data/.seeded"
if [ -f "$SEED_MARKER" ]; then
  echo "Seed marker found ($SEED_MARKER), skipping seed."
else
  echo "Running database seed (first run)..."
  if node prisma/seed.js; then
    touch "$SEED_MARKER"
    echo "Seed complete. Marker created."
  else
    echo "Seed failed — marker NOT created, will retry on next start."
  fi
fi

# Next.js 서비스 기동
echo "Starting Next.js application..."
exec node server.js
