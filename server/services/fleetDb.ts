import { db } from "../../db/index";

/**
 * neon-http has a parser bug where empty result sets crash with
 * "Cannot read properties of null (reading 'map')". This wrapper swallows
 * that specific error and returns an empty array instead. All Fleet routes
 * use this instead of calling db.execute directly.
 */
export async function fleetExec(query: any): Promise<any[]> {
  try {
    const r: any = await db.execute(query);
    return r?.rows ?? r ?? [];
  } catch (err: any) {
    if (/reading 'map'|Cannot read properties of null/i.test(String(err?.message))) {
      return [];
    }
    throw err;
  }
}
