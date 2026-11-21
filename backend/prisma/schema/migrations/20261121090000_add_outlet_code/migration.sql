-- AlterTable
ALTER TABLE "outlets" ADD COLUMN "code" VARCHAR(10) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "outlets_code_key" ON "outlets"("code");

-- Code must be 2-10 uppercase letters (used as receipt prefix, e.g. DHA-000001)
ALTER TABLE "outlets" ADD CONSTRAINT chk_outlet_code_format CHECK (code ~ '^[A-Z]{2,10}$');
