"use strict"
import Sql from "./../Sql"
import {RowDataPacket, FieldPacket} from "mysql2"
import {Channel} from "../../channel/Channel"

export interface ISqlRewardVoice {
  id: number,
  roomId: number,
  rewardId: string,
  voicesId: number,
  voiceId?: string
  voicesName?: string
  isConversation: boolean,
  isSubOnly: boolean
}

export class SqlRewardVoice {
  static async getAllForChannel (roomId: number): Promise<ISqlRewardVoice[]> {
    const [rows]: [RowDataPacket[], FieldPacket[]] = await Sql.query<RowDataPacket[]>(`
        SELECT rv.id             AS id,
               rv.roomId         AS roomId,
               v.id              AS voicesId,
               v.voiceId         AS voiceId,
               v.voiceName       AS voiceName,
               rv.isConversation AS isConversation,
               rv.isSubOnly      AS isSubOnly
        FROM rewardVoice rv
                 INNER JOIN voices v on rv.voicesId = v.id
        WHERE roomId = ?;`, [roomId])

    return <ISqlRewardVoice[]>rows
  }

  static async addOrUpdateRewardVoiceByVoiceId (roomId: number, rewardId: string, voiceId: number, isConversation: boolean, isSubOnly: boolean): Promise<void> {
    await Sql.query(`INSERT INTO rewardVoice (roomId, rewardId, voicesId, isConversation, isSubOnly)
                     VALUES (?, ?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE roomId         = VALUES(roomId),
                                             voicesId       = VALUES(voicesId),
                                             isConversation = VALUES(isConversation),
                                             isSubOnly      = VALUES(isSubOnly);
    `, [roomId, rewardId, voiceId, isConversation, isSubOnly])
  }

  static async updateChannelInDb (channel: Channel): Promise<void> {
    //await SqlRewardVoice.addOrUpdateRewardVoiceByVoiceId()
  }

  /**
   * @return {boolean} Does the channel still exists in the db
   */
  static async updateChannelFromDb (channel: Channel): Promise<boolean> {
    const [rows]: [RowDataPacket[], FieldPacket[]] = await Sql.query<RowDataPacket[]>(`
        SELECT roomId,
               channelName,
               isTwitchPartner,
               maxMessageLength,
               minCooldown,
               ircMuted,
               isQueueMessages,
               volume,
               canModsChangeSettings
        FROM channels
        WHERE enabled = b'1'
          AND roomId = ?;`, [channel.roomId])

    if (rows.length > 0) {
      const row = rows[0]
      //channel.updateDbSettingsFromOtherChannel(<ISqlRewardVoice>row)
      return true
    }
    return false
  }
}

