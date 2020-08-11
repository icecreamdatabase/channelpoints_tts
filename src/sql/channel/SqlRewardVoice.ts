"use strict"
import Sql from "./../Sql"
import {RowDataPacket, FieldPacket} from "mysql2"

export interface ISqlRewardVoice {
  id: number,
  roomId: number,
  rewardId: string,
  voicesId: number,
  isConversation: boolean,
  isSubOnly: boolean,
  cooldown: number
}

export class SqlRewardVoice {
  public static async get (roomId: number, rewardId: string): Promise<ISqlRewardVoice | undefined> {
    const [rows]: [RowDataPacket[], FieldPacket[]] = await Sql.query<RowDataPacket[]>(`
        SELECT id,
               roomId,
               voicesId,
               isConversation,
               isSubOnly
        FROM rewardVoice
        WHERE rewardId = ?;`, [rewardId])

    if (rows.length > 0) {
      const rewardVoice = <ISqlRewardVoice>rows[0]
      if (rewardVoice.roomId === roomId) {
        return rewardVoice
      }
    }
    return undefined
  }
}

