"use strict"
import Sql from "./../Sql"
import {RowDataPacket, FieldPacket} from "mysql2"

export interface ISqlChannel {
  roomId: number,
  channelName: string,
  isTwitchPartner: boolean,
  maxMessageLength: number,
  minCooldown: number,
  timeoutCheckTime: number,
  ircMuted: boolean,
  isQueueMessages: boolean,
  volume: number,
  canModsChangeSettings: boolean
}

export class SqlChannels {
  static async get (roomId: number): Promise<ISqlChannel | undefined> {
    const [rows]: [RowDataPacket[], FieldPacket[]] = await Sql.query<RowDataPacket[]>(`
        SELECT roomId,
               channelName,
               isTwitchPartner,
               maxMessageLength,
               minCooldown,
               timeoutCheckTime,
               ircMuted,
               isQueueMessages,
               volume,
               canModsChangeSettings
        FROM channels
        WHERE enabled = b'1'
          AND roomId = ?;`, [roomId])

    if (rows.length > 0) {
      return <ISqlChannel>rows[0]
    }
    return undefined
  }

  static async updateChannelName (roomId: number, newChannelName: string): Promise<void> {
    await Sql.query(`UPDATE IGNORE channels
                     SET channelName = ?
                     WHERE roomId = ?;`, [newChannelName, roomId])
  }

  static async getBasicChannelData (): Promise<Map<number, string>> {
    const [rows]: [RowDataPacket[], FieldPacket[]] = await Sql.query<RowDataPacket[]>(`
        SELECT roomId, channelName
        FROM channels
        WHERE enabled = b'1';`)

    const channels: Map<number, string> = new Map<number, string>()
    rows.forEach(row => channels.set(parseInt(row.roomId), row.channelName))
    return channels
  }

  static async disableChannel (roomId: number | string): Promise<void> {
    await Sql.query(`UPDATE IGNORE channels
                     SET enabled = b'0'
                     WHERE roomId = ?; `, [roomId])
  }
}

