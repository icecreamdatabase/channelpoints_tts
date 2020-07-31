"use strict"
import Sql from "./../Sql"
import {RowDataPacket, FieldPacket} from "mysql2";


export class SqlGlobalUserBlacklist {
  /**
   * Get a list of blacklisted userIDs
   */
  static async getUserIds (): Promise<number[]> {
    const [rows]: [RowDataPacket[], FieldPacket[]] = await Sql.query<RowDataPacket[]>(`
        SELECT userId
        FROM globalUserBlacklist;`)

    return rows.map(x => x["userId"])
  }

  /**
   * Add userID to blacklist.
   * @param userId
   */
  static addUserId (userId: number | string): void {
    Sql.query(` INSERT IGNORE INTO globalUserBlacklist (userId)
                VALUES (?);`, [userId])
  }
}
