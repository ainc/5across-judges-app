import { PrismaClient } from "@prisma/client";
import { saltAndHashPassword } from "../src/utils/password";

const prisma = new PrismaClient();

async function seedUser(
  username: string,
  password: string,
  role: "ADMIN" | "JUDGE",
  judgeCode?: string,
) {
  await prisma.user.upsert({
    where: { username },
    update: {
      passwordHash: await saltAndHashPassword(password),
      role,
      judgeCode: judgeCode ?? null,
    },
    create: {
      username,
      passwordHash: await saltAndHashPassword(password),
      role,
      judgeCode: judgeCode ?? null,
    },
  });
}

async function main() {
  const adminUsername = process.env.ADMIN_USERNAME ?? "admin";
  const adminPassword = process.env.ADMIN_PASSWORD;
  const judgePassword = process.env.JUDGE_PASSWORD;

  if (!adminPassword || !judgePassword) {
    throw new Error(
      "Set ADMIN_PASSWORD and JUDGE_PASSWORD in .env before running db:seed.",
    );
  }

  await seedUser(adminUsername, adminPassword, "ADMIN");
  await seedUser(process.env.JUDGE1_USERNAME ?? "judge1", judgePassword, "JUDGE", "JA");
  await seedUser(process.env.JUDGE2_USERNAME ?? "judge2", judgePassword, "JUDGE", "JB");
  await seedUser(process.env.JUDGE3_USERNAME ?? "judge3", judgePassword, "JUDGE", "JC");

  await prisma.score.deleteMany();
  await prisma.submissionSession.deleteMany();
  await prisma.category.deleteMany();
  await prisma.company.deleteMany();
  await prisma.judge.deleteMany();
  await prisma.competition.deleteMany();

  const competition = await prisma.competition.create({
    data: {
      name: "5 Across",
      eventDate: new Date("2026-06-24"),
      isActive: true,
      judges: {
        create: [
          { name: "Judge A", code: "JA" },
          { name: "Judge B", code: "JB" },
          { name: "Judge C", code: "JC" },
        ],
      },
      companies: {
        create: [
          { name: "Company A" },
          { name: "Company B" },
          { name: "Company C" },
          { name: "Company D" },
          { name: "Company E" },
        ],
      },
      categories: {
        create: [
          {
            name: "Strength / Creativity / Uniqueness of idea / Technology",
            weight: 15,
            maxScore: 5,
          },
          {
            name: "Description / Knowledge of the target market",
            weight: 20,
            maxScore: 5,
          },
          { name: "Traction / Growth", weight: 25, maxScore: 5 },
          { name: "Revenue Model", weight: 20, maxScore: 5 },
          { name: "Team / Advisors", weight: 15, maxScore: 5 },
          {
            name: "Quality of overall pitch / Presentation",
            weight: 5,
            maxScore: 5,
          },
        ],
      },
    },
    select: { id: true, name: true },
  });

  await prisma.competition.create({
    data: {
      name: "5 Across",
      eventDate: new Date("2025-11-20"),
      isActive: false,
      judges: { create: [{ name: "Archived Judge 1" }, { name: "Archived Judge 2" }] },
      companies: { create: [{ name: "Legacy Co A" }, { name: "Legacy Co B" }] },
      categories: {
        create: [
          { name: "Idea", weight: 50, maxScore: 5 },
          { name: "Execution", weight: 50, maxScore: 5 },
        ],
      },
    },
  });

  console.log(`Seeded active competition: ${competition.name}`);
  console.log(`Seeded admin user: ${adminUsername}`);
  console.log(
    "Seeded judge logins: judge1/judge2/judge3 (linked by code JA/JB/JC, or by judge order if codes change)",
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
