// This module provides a minimal Prisma-based SQL pool for raw queries.
import { prisma } from "../prisma.js";
// A class that mimics the `pg` Pool API using Prisma's raw query functions.
class PrismaSqlPool {
    async query(sql, params = []) {
        const normalized = sql.trim().toLowerCase();
        const isRead = normalized.startsWith("select") || normalized.startsWith("with");
        // Use $queryRawUnsafe for read queries and $executeRawUnsafe for write queries.
        if (isRead) {
            const rows = (await prisma.$queryRawUnsafe(sql, ...params));
            return { rows, rowCount: rows.length };
        }
        const rowCount = await prisma.$executeRawUnsafe(sql, ...params);
        return { rows: [], rowCount: Number(rowCount) || 0 };
    }
}
// Singleton instance of the PrismaSqlPool.
let pool = null;
// Returns the singleton instance of the PrismaSqlPool.
export function getPool() {
    if (!pool)
        pool = new PrismaSqlPool();
    return pool;
}
