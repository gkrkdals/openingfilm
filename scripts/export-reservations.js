// 기존 예약 데이터를 구글 스프레드시트로 일괄 이관하는 일회성 스크립트.
// 시트 연동을 처음 세팅한 직후 한 번만 실행하세요: node scripts/export-reservations.js
// 여러 번 실행하면 시트에 같은 예약이 중복으로 쌓입니다.
// 세팅 방법은 docs/google-sheets-setup.md 참고.

/* eslint-disable @typescript-eslint/no-require-imports -- prisma/seed.js와 같은 CommonJS 실행 스크립트 */
const fs = require("fs");
const path = require("path");

// .env 로드 (외부 의존성 없이 단순 파싱)
const envPath = path.join(__dirname, "..", ".env");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (m && !(m[1] in process.env)) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const url = process.env.SHEETS_WEBHOOK_URL;
  if (!url) {
    console.error("SHEETS_WEBHOOK_URL이 설정되어 있지 않습니다. .env를 확인하세요.");
    process.exit(1);
  }

  const reservations = await prisma.reservation.findMany({
    orderBy: { createdAt: "asc" },
  });

  if (reservations.length === 0) {
    console.log("이관할 예약이 없습니다.");
    return;
  }

  console.log(`예약 ${reservations.length}건을 시트로 전송합니다...`);

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      token: process.env.SHEETS_WEBHOOK_TOKEN,
      reservations: reservations.map((r) => ({
        groom_name: r.groomName,
        bride_name: r.brideName,
        wedding_date: r.weddingDate,
        wedding_time: r.weddingTime,
        wedding_location: r.weddingLocation,
        contact: r.contact,
        email: r.email,
        created_at: r.createdAt.toISOString(),
      })),
    }),
  });

  const body = await res.text();
  let parsed = null;
  try {
    parsed = JSON.parse(body);
  } catch {
    // Apps Script가 JSON이 아닌 응답(HTML 에러 페이지 등)을 줄 수 있음
  }

  if (!res.ok || !parsed || !parsed.success) {
    console.error("전송 실패:", res.status, parsed ? JSON.stringify(parsed) : body.slice(0, 500));
    process.exit(1);
  }

  console.log(`완료: 시트에 ${parsed.count}건 추가되었습니다.`);
}

main()
  .catch((e) => {
    console.error("이관 중 오류:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
