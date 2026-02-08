import { prisma } from "../prisma.js";
class PrismaSqlPool {
    async query(sql, params = []) {
        const normalized = sql.trim().toLowerCase();
        const isRead = normalized.startsWith("select") || normalized.startsWith("with");
        if (isRead) {
            const rows = (await prisma.$queryRawUnsafe(sql, ...params));
            return { rows, rowCount: rows.length };
        }
        const rowCount = await prisma.$executeRawUnsafe(sql, ...params);
        return { rows: [], rowCount: Number(rowCount) || 0 };
    }
}
let pool = null;
export function getPool() {
    if (!pool)
        pool = new PrismaSqlPool();
    return pool;
}
