"use strict"
import Sql from "./../Sql"
import {RowDataPacket, FieldPacket} from "mysql2"

export class SqlChannelUserBlacklist {
  /**
   * Get a list of blacklisted userIDs
   */
  static async getUserIds (roomId: number): Promise<number[]> {
    const [rows]: [RowDataPacket[], FieldPacket[]] = await Sql.query<RowDataPacket[]>(`
        SELECT userId
        FROM channelUserBlacklist
        WHERE roomId = ?;`, [roomId])

    return rows.map(x => x["userId"])
  }

  /**
   * Add userID to blacklist.
   */
  static addUserId (roomId: number | string, userId: number | string): void {
    Sql.query(` INSERT IGNORE INTO channelUserBlacklist (roomId, userId)
                VALUES (?, ?);`, [roomId, userId])
  }
}
