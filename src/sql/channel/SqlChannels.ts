"use strict"
import Sql from "./../Sql"
import {RowDataPacket, FieldPacket} from "mysql2"
import {Channel} from "../../channel/Channel"

export interface ISqlChannel {
  roomId: number,
  channelName: string,
  isTwitchPartner: boolean,
  maxMessageLength: number,
  minCooldown: number,
  ircMuted: boolean,
  isQueueMessages: boolean,
  volume: number,
  canModsChangeSettings: boolean
}

export class SqlChannels {
  static async getChannels (): Promise<ISqlChannel[]> {
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
        WHERE enabled = b'1';`)

    return <ISqlChannel[]>rows
  }

  static async addOrUpdateChannel (roomId: number, channelName: string, isTwitchPartner: boolean, maxMessageLength: number, minCooldown: number, ircMuted: boolean, isQueueMessages: boolean, volume: number, canModsChangeSettings: boolean): Promise<void> {
    await Sql.query(`INSERT INTO channels (roomId, channelName, isTwitchPartner, maxMessageLength, minCooldown,
                                           ircMuted, isQueueMessages, volume, canModsChangeSettings)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE channelName           = VALUES(channelName),
                                             isTwitchPartner       = VALUES(isTwitchPartner),
                                             maxMessageLength      = VALUES(maxMessageLength),
                                             minCooldown           = VALUES(minCooldown),
                                             ircMuted              = VALUES(ircMuted),
                                             isQueueMessages       = VALUES(isQueueMessages),
                                             volume                = VALUES(volume),
                                             canModsChangeSettings = VALUES(canModsChangeSettings);
    `, [roomId, channelName, isTwitchPartner, maxMessageLength, minCooldown, ircMuted, isQueueMessages, volume, canModsChangeSettings])
  }

  static async updateChannelInDb (channel: Channel): Promise<void> {
    await SqlChannels.addOrUpdateChannel(channel.roomId, channel.channelName, channel.isTwitchPartner, channel.maxMessageLength, channel.minCooldown, channel.ircMuted, channel.isQueueMessages, channel.volume, channel.canModsChangeSettings)
  }

  /**
   * @return {boolean} Does the channel still exists in the db
   */
  static async updateChannelFromDb (channel: Channel): Promise<boolean> {
    const [rows]: [RowDataPacket[], FieldPacket[]] = await Sql.query<RowDataPacket[]>(`
        SELECT roomId, channelName, isTwitchPartner, maxMessageLength, minCooldown, ircMuted, isQueueMessages, volume, canModsChangeSettings
        FROM channels
        WHERE enabled = b'1'
          AND roomId = ?;`, [channel.roomId])

    if (rows.length > 0) {
      const row = rows[0]
      channel.updateDbSettingsFromOtherChannel(<ISqlChannel>row)
      return true
    }
    return false
  }

  static async dropChannel (roomId: number | string): Promise<void> {
    await Sql.query(`DELETE
                     FROM channels
                     WHERE roomId = ?; `, [roomId])
  }
}

