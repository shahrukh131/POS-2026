-- AlterTable: client-generated UUID, idempotency key for offline POS sync
ALTER TABLE "sales" ADD COLUMN "client_id" UUID;

-- CreateIndex
CREATE UNIQUE INDEX "sales_client_id_key" ON "sales"("client_id");
