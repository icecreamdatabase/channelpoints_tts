"use strict"
import Sql from "./../Sql"
import {FieldPacket, RowDataPacket} from "mysql2"

export interface ISqlBotSpecialUsers {
  UserId: number,
  IsIrcBot: boolean,
  IsBotOwner: boolean,
  IsBotAdmin: boolean,
}

export class SqlBotSpecialUsers {
  /**
   * Get a list of special users like Owner and admins
   */
  static async getSpecialUsers (): Promise<ISqlBotSpecialUsers[]> {
    const [rows]: [RowDataPacket[], FieldPacket[]] = await Sql.query<RowDataPacket[]>(`
        SELECT userId
        FROM GlobalUserBlacklist;`)

    return rows as ISqlBotSpecialUsers[]
  }
}
