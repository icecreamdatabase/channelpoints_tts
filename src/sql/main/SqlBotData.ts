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
  botOwners?: string,
  botAdmins?: string,
  botOwnersParsed?: number[],
  botAdminsParsed?: number[]
}

export class SqlBotData {
  public static async getBotData (): Promise<IBotData> {
    const [rows]: [RowDataPacket[], FieldPacket[]] = await Sql.query<RowDataPacket[]>(`SELECT *
                                                                                       FROM botData;`)
    const botData: IBotData = {}
    for (const row of rows) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      botData[row.key] = row.value
    }
    return botData
  }

  public static async set (key: string, value: string): Promise<void> {
    await Sql.query(` INSERT INTO botData (\`key\`, value)
                      VALUES (?, ?)
                      ON DUPLICATE KEY UPDATE value = VALUES(value); `, [key, value])
  }
}
