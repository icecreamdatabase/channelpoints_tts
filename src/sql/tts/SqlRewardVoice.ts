"use strict"
import Sql from "../Sql"
import {FieldPacket, RowDataPacket} from "mysql2"

export interface ISqlReward {
  RewardId: string,
  ChannelId: number,
  VoiceId: string,
  IsConversation: boolean,
  IsSubOnly: boolean,
  Cooldown: number
}

export class SqlRewardVoice {
  public static async get (roomId: number, rewardId: string): Promise<ISqlReward | undefined> {
    const [rows]: [RowDataPacket[], FieldPacket[]] = await Sql.query<RowDataPacket[]>(`
        SELECT RewardId,
               ChannelId,
               VoiceId,
               IsConversation,
               IsSubOnly,
               Cooldown
        FROM  Rewards
        WHERE rewardId = ?;`, [rewardId])

    if (rows.length > 0) {
      const rewardVoice = <ISqlReward>rows[0]
      if (rewardVoice.ChannelId === roomId) {
        return rewardVoice
      }
    }
    return undefined
  }
}

