#!/bin/sh

# 데이터베이스가 없거나 스키마가 변경되었을 시 자동 업데이트 실행
echo "Running prisma db push..."
npx prisma db push --accept-data-loss

# 초기 기본 데이터 시딩 실행
echo "Running database seed..."
node prisma/seed.js

# Next.js 서비스 기동
echo "Starting Next.js application..."
exec node server.js
