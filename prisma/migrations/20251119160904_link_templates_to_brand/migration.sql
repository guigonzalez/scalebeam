/*
  Warnings:

  - You are about to drop the column `thumbnailUrl` on the `Template` table. All the data in the column will be lost.
  - Added the required column `brandId` to the `Template` table without a default value. This is not possible if the table is not empty.
  - Added the required column `imageUrl` to the `Template` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Template" DROP COLUMN "thumbnailUrl",
ADD COLUMN     "brandId" TEXT NOT NULL,
ADD COLUMN     "imageUrl" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Template" ADD CONSTRAINT "Template_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;
