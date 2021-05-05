"use strict"
import Sql from "./../Sql"
import {FieldPacket, RowDataPacket} from "mysql2"


export class SqlGlobalUserBlacklist {
  /**
   * Get a list of blacklisted userIDs
   */
  static async getUserIds (): Promise<number[]> {
    const [rows]: [RowDataPacket[], FieldPacket[]] = await Sql.query<RowDataPacket[]>(`
        SELECT userId
        FROM GlobalUserBlacklist;`)

    return rows.map(x => x["userId"])
  }

  /**
   * Add userID to blacklist.
   * @param userId
   */
  static addUserId (userId: number | string): void {
    Sql.query(` INSERT IGNORE INTO GlobalUserBlacklist (userId)
                VALUES (?);`, [userId])
  }
}
