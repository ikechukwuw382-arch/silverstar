CREATE TABLE "ServiceRequest" (
  "id" TEXT NOT NULL,
  "requestNumber" TEXT NOT NULL UNIQUE,
  "customerId" TEXT NOT NULL,
  "engineerId" TEXT,
  "printerBrand" TEXT NOT NULL,
  "printerModel" TEXT NOT NULL,
  "serviceType" TEXT NOT NULL,
  "problemDescription" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "state" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "address" TEXT NOT NULL,
  "additionalInfo" TEXT,
  "imageUrl" TEXT,
  "status" TEXT NOT NULL DEFAULT 'Requested',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ServiceRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ServiceQuote" (
  "id" TEXT NOT NULL,
  "requestId" TEXT NOT NULL UNIQUE,
  "diagnosis" TEXT NOT NULL,
  "partsCost" INTEGER NOT NULL,
  "labourCost" INTEGER NOT NULL,
  "totalCost" INTEGER NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'Pending',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ServiceQuote_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_customerId_fkey"
  FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE CASCADE;

ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_engineerId_fkey"
  FOREIGN KEY ("engineerId") REFERENCES "User"("id") ON DELETE SET NULL;

ALTER TABLE "ServiceQuote" ADD CONSTRAINT "ServiceQuote_requestId_fkey"
  FOREIGN KEY ("requestId") REFERENCES "ServiceRequest"("id") ON DELETE CASCADE;
