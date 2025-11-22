-- AlterTable: Rename briefingCsvUrl to briefingUrl to support multiple file types
ALTER TABLE "Project" RENAME COLUMN "briefingCsvUrl" TO "briefingUrl";

-- Update comments
COMMENT ON COLUMN "Project"."briefingUrl" IS 'URL do arquivo de briefing (CSV, DOC, PDF, etc)';
COMMENT ON COLUMN "Project"."briefingData" IS 'JSON string com dados parseados (se aplicável)';
