import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function getRuntimeDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    return undefined;
  }

  const url = new URL(databaseUrl);
  if (url.port === "6543") {
    const configuredLimit = Number.parseInt(process.env.PRISMA_CONNECTION_LIMIT ?? "5", 10);
    const connectionLimit = Number.isInteger(configuredLimit) && configuredLimit > 0 ? configuredLimit : 5;
    url.searchParams.set("pgbouncer", "true");
    url.searchParams.set("connection_limit", String(connectionLimit));
  }

  return url.toString();
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: getRuntimeDatabaseUrl(),
    log: ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
