"use strict"
import Sql from "./../Sql"
import {FieldPacket, RowDataPacket} from "mysql2"

export interface IBotData {
  userId?: number,
  userName?: string,
  clientId?: string,
  clientSecret?: string,
  access_token?: string,
  refresh_token?: string
  supinicApiUser?: number,
  supinicApiKey?: string,
  botOwnersParsed?: number[],
  botAdminsParsed?: number[]
}

interface ISqlBotData {
  [key: string]: string
}

export class SqlBotData {
  public static async getBotData (): Promise<IBotData> {
    const [rows]: [RowDataPacket[], FieldPacket[]] = await Sql.query<RowDataPacket[]>(`SELECT *
                                                                                       FROM BotData;`)
    const botData: ISqlBotData = {}
    for (const row of (rows as ISqlBotData[])) {
      botData[row.Key] = row.Value
    }
    return botData
  }

  public static async set (key: string, value: string): Promise<void> {
    await Sql.query(` INSERT INTO BotData (\`key\`, value)
                      VALUES (?, ?)
                      ON DUPLICATE KEY UPDATE value = VALUES(value); `, [key, value])
  }
}
