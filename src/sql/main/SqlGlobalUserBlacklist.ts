"use strict"
import util from "util"
import {Logger} from "../../helper/Logger";
import Sql from "./../Sql"
import {RowDataPacket, FieldPacket} from "mysql2";


export class SqlGlobalUserBlacklist {
  /**
   * Get a list of blacklisted userIDs
   */
  static async getUserIds (): Promise<number[]> {
    const [rows, fields]: [RowDataPacket[], FieldPacket[]] = await Sql.query<RowDataPacket[]>(`
        SELECT userId
        FROM globalUserBlacklist;`)

    return rows.map(x => x["userId"])
  }

  /**
   * Add userID to blacklist.
   * @param userId
   */
  static addUserId (userId: number | string) {
    Sql.query(` INSERT INTO globalUserBlacklist (userId)
                VALUES (?)
                ON DUPLICATE KEY UPDATE addDate = DEFAULT;`, [userId])
  }
}
