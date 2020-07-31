"use strict"
import Sql from "./../Sql"
import {RowDataPacket, FieldPacket} from "mysql2"
import {Channel} from "../../channel/Channel"

export interface ISqlChannel {
  roomId: number,
  channelName: string,
  isTwitchPartner: boolean,
  maxMessageLength: number,
  minCooldown: number
}

export class SqlChannels {
  static async getChannels (): Promise<ISqlChannel[]> {
    const [rows]: [RowDataPacket[], FieldPacket[]] = await Sql.query<RowDataPacket[]>(`
        SELECT roomId, channelName, isTwitchPartner, maxMessageLength, minCooldown
        FROM channels
        WHERE enabled = b'1';`)

    return <ISqlChannel[]>rows
  }

  static async addOrUpdateChannel (roomId: number, channelName: string, isTwitchPartner: boolean, maxMessageLength: number, minCooldown: number): Promise<void> {
    await Sql.query(`INSERT INTO channels (roomId, channelName, isTwitchPartner, maxMessageLength, minCooldown)
                     VALUES (?, ?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE channelName      = VALUES(channelName),
                                             isTwitchPartner  = VALUES(isTwitchPartner),
                                             maxMessageLength = VALUES(maxMessageLength),
                                             minCooldown      = VALUES(minCooldown);
    `, [roomId, channelName, isTwitchPartner, maxMessageLength, minCooldown])
  }

  static async updateChannelInDb (channel: Channel): Promise<void> {
    await SqlChannels.addOrUpdateChannel(channel.roomId, channel.channelName, channel.isTwitchPartner, channel.maxMessageLength, channel.minCooldown)
  }

  /**
   * @return {boolean} Does the channel still exists in the db
   */
  static async updateChannelFromDb (channel: Channel): Promise<boolean> {
    const [rows]: [RowDataPacket[], FieldPacket[]] = await Sql.query<RowDataPacket[]>(`
        SELECT roomId, channelName, isTwitchPartner, maxMessageLength, minCooldown
        FROM channels
        WHERE enabled = b'1'
          AND roomId = ?;`, [channel.roomId])

    if (rows.length > 0) {
      const row = rows[0]
      channel.channelName = row.channelName
      channel.isTwitchPartner = row.isTwitchPartner
      channel.maxMessageLength = row.maxMessageLength
      channel.minCooldown = row.minCooldown
      return true
    }
    return false
  }
}

