import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";
import { attachDatabasePool } from "@vercel/functions";
import pg from "pg";
import { PrismaClient } from "@/generated/prisma/client";

const pooledConnectionString = process.env.DATABASE_URL;
const migrationOnlyDirectConnectionString = process.env.DIRECT_URL;

const connectionString =
  pooledConnectionString ?? migrationOnlyDirectConnectionString;
if (!connectionString) {
  throw new Error("DATABASE_URL or DIRECT_URL must be set");
}

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createPrismaClient(): PrismaClient {
  const pool = new pg.Pool({ connectionString, max: 5 });
  attachDatabasePool(pool);
  return new PrismaClient({ adapter: new PrismaPg(pool) });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
