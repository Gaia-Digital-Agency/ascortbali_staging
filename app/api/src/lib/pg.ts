import { prisma } from "../prisma.js";

type QueryResult = {
  rows: any[];
  rowCount: number;
};

class PrismaSqlPool {
  async query(sql: string, params: any[] = []): Promise<QueryResult> {
    const normalized = sql.trim().toLowerCase();
    const isRead = normalized.startsWith("select") || normalized.startsWith("with");

    if (isRead) {
      const rows = (await prisma.$queryRawUnsafe(sql, ...params)) as any[];
      return { rows, rowCount: rows.length };
    }

    const rowCount = await prisma.$executeRawUnsafe(sql, ...params);
    return { rows: [], rowCount: Number(rowCount) || 0 };
  }
}

let pool: PrismaSqlPool | null = null;

export function getPool() {
  if (!pool) pool = new PrismaSqlPool();
  return pool;
}
