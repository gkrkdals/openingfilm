const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DEFAULT_CONTENT = {
  hero_title_1: "당신의 가장 아름다운 오프닝을 기록합니다.",
  hero_title_2: "오프닝필름",
  hero_desc: "결혼이라는 인생 최고의 영화, 그 시작을 기록합니다. 자연스러운 미소와 눈물, 그날의 공기를 담백하게 담아낼게요.",
  hero_youtube_id: "hUZnXJjCogI",
  about_title: "결혼식이라는 인생 최고의 영화, 그 아름다운 오프닝을 기록합니다.",
  about_text_1: "결혼 준비를 시작하며 수많은 선택지와 마주할 때, 가장 설레어야 할 순간에 밀려오는 예산의 벽과 복잡한 업체의 구성들로 지치진 않으셨나요?",
  about_text_2: "화려하게 포장된 무거운 패키지, 알 수 없는 기준의 추가 비용들 속에서 \"정작 중요한 본질은 무엇일까\" 고민했습니다. 본식 영상의 본질은 화려한 연출이나 비싼 가격이 아니라, 그날 두 사람이 나눈 눈빛, 떨리는 손길, 그리고 축하해 주러 오신 소중한 분들의 따뜻한 미소를 온전히 담아내는 것이라 믿기 때문입니다.",
  about_text_3: "그래서 우리는 거품을 걷어내기로 했습니다. 화려한 수식어 대신 정직한 가격을, 복잡한 구성 대신 직관적이고 심플한 시스템을 선택했습니다. 가격의 문턱은 낮추었지만, 그날의 감동을 포착하는 시선의 깊이는 결코 가볍지 않습니다.",
  about_bottom: "새로운 시작을 앞둔 두 사람을 온 마음으로 축하합니다.",
  price_title: "1인 3캠 4K 촬영부터 숏폼까지 올인원 [단일] 구성",
  price_val: "360,000원",
  contact_kakao_url: "http://pf.kakao.com/_DaAbX",
  contact_phone: "010-4111-9775 / openingfilm@naver.com",
};

const DEFAULT_REGULAR = [
  { title: "오프닝필름 샘플 1", youtubeId: "gKC6YGV8QGY", type: "regular", orderIndex: 0 },
  { title: "오프닝필름 샘플 2", youtubeId: "6MGtuoj-4b0", type: "regular", orderIndex: 1 },
  { title: "오프닝필름 샘플 3", youtubeId: "fSw9FgvUKAw", type: "regular", orderIndex: 2 },
  { title: "오프닝필름 샘플 4", youtubeId: "Fc2M-FkgR8s", type: "regular", orderIndex: 3 },
];

const DEFAULT_SHORTS = [
  { title: "오프닝필름 숏폼 1", youtubeId: "UBT8NjGH510", type: "shorts", orderIndex: 0 },
  { title: "오프닝필름 숏폼 2", youtubeId: "ojUzdvQO7ZI", type: "shorts", orderIndex: 1 },
  { title: "오프닝필름 숏폼 3", youtubeId: "by09u6yabJQ", type: "shorts", orderIndex: 2 },
];

const DEFAULT_REVIEWS = [
  {
    author: "김서연",
    content: "가격 부담 없이도 가장 소중한 순간이 생생하게 남았어요. 진심이 느껴졌습니다.",
    orderIndex: 0,
  },
  {
    author: "박지훈",
    content: "촬영이 자연스러워서 긴장이 풀렸어요. 영상도 따뜻하게 완성됐습니다.",
    orderIndex: 1,
  },
  {
    author: "이민지",
    content: "가족들 반응이 최고였습니다. 다음 기념일에도 꼭 다시 보고 싶어요.",
    orderIndex: 2,
  },
];

async function main() {
  console.log("Seeding database...");

  // 1. SiteContent Seeding (Upsert)
  for (const [key, value] of Object.entries(DEFAULT_CONTENT)) {
    await prisma.siteContent.upsert({
      where: { key },
      update: {},
      create: { key, value },
    });
  }
  console.log("SiteContent seeded.");

  // 2. Portfolios Seeding (Only if empty)
  const portfolioCount = await prisma.portfolio.count();
  if (portfolioCount === 0) {
    for (const item of [...DEFAULT_REGULAR, ...DEFAULT_SHORTS]) {
      await prisma.portfolio.create({
        data: item
      });
    }
    console.log("Portfolios seeded.");
  } else {
    console.log("Portfolios table is not empty, skipping seed.");
  }

  // 3. Reviews Seeding (Only if empty)
  const reviewCount = await prisma.review.count();
  if (reviewCount === 0) {
    for (const item of DEFAULT_REVIEWS) {
      await prisma.review.create({
        data: item
      });
    }
    console.log("Reviews seeded.");
  } else {
    console.log("Reviews table is not empty, skipping seed.");
  }

  console.log("Seeding finished successfully!");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
