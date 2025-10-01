-- CreateTable
CREATE TABLE "public"."HttpRequestLog" (
    "id" UUID NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" UUID,
    "organizationId" UUID,
    "roles" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "subjectScopes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "ipAddress" TEXT,
    "forwardedFor" TEXT,
    "userAgent" TEXT,
    "method" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "durationMs" INTEGER NOT NULL,
    "queryJson" JSONB,
    "paramsJson" JSONB,
    "bodyDigest" TEXT,
    "responseDigest" TEXT,
    "correlationId" TEXT,
    CONSTRAINT "HttpRequestLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HttpRequestLog_occurredAt_idx" ON "public"."HttpRequestLog"("occurredAt");

-- CreateIndex
CREATE INDEX "HttpRequestLog_userId_idx" ON "public"."HttpRequestLog"("userId");

-- CreateIndex
CREATE INDEX "HttpRequestLog_statusCode_idx" ON "public"."HttpRequestLog"("statusCode");

-- CreateIndex
CREATE INDEX "HttpRequestLog_path_idx" ON "public"."HttpRequestLog"("path");

-- CreateIndex
CREATE INDEX "HttpRequestLog_organizationId_idx" ON "public"."HttpRequestLog"("organizationId");

-- Enable RLS
ALTER TABLE "public"."HttpRequestLog" ENABLE ROW LEVEL SECURITY;

-- Select policy limited to system admins or matching organization context
CREATE POLICY "http_request_logs_select" ON "public"."HttpRequestLog"
  FOR SELECT
  USING (
    current_setting('app.is_system_admin', true) = 'true'
    OR (
      current_setting('app.organization_id', true) <> ''
      AND "organizationId"::text = current_setting('app.organization_id', true)
    )
  );

-- Insert policy allows application service to write logs
CREATE POLICY "http_request_logs_insert" ON "public"."HttpRequestLog"
  FOR INSERT
  WITH CHECK (true);

-- Delete policy restricted to system context for pruning jobs
CREATE POLICY "http_request_logs_delete" ON "public"."HttpRequestLog"
  FOR DELETE
  USING (current_setting('app.is_system_admin', true) = 'true');
