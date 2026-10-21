-- CreateTable
CREATE TABLE "JudgeNote" (
    "id" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "judgeId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "body" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JudgeNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "JudgeNote_competitionId_judgeId_companyId_key" ON "JudgeNote"("competitionId", "judgeId", "companyId");

-- AddForeignKey
ALTER TABLE "JudgeNote" ADD CONSTRAINT "JudgeNote_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JudgeNote" ADD CONSTRAINT "JudgeNote_judgeId_fkey" FOREIGN KEY ("judgeId") REFERENCES "Judge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JudgeNote" ADD CONSTRAINT "JudgeNote_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
