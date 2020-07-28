"use strict"
import util from "util"
import {Logger} from "../../helper/Logger";
import Sql from "./../Sql"
import {RowDataPacket, FieldPacket} from "mysql2";

export class SqlChannel {
  private readonly _roomId: number | string;
  private _channelName: string;
  private _isTwitchPartner: boolean;
  private _maxMessageLength: number;
  private _minCooldown: number;

  constructor (roomId: number | string, channelName: string, isTwitchPartner: boolean, maxMessageLength: number, minCooldown: number) {
    this._roomId = roomId
    this._channelName = channelName
    this._isTwitchPartner = isTwitchPartner
    this._maxMessageLength = maxMessageLength
    this._minCooldown = minCooldown
  }

  get roomId (): number | string {
    return this._roomId
  }

  get channelName (): string {
    return this._channelName
  }

  set channelName (value: string) {
    this._channelName = value
    SqlChannels.updateChannelInDb(this)
  }

  get isTwitchPartner (): boolean {
    return this._isTwitchPartner
  }

  set isTwitchPartner (value: boolean) {
    this._isTwitchPartner = value
    SqlChannels.updateChannelInDb(this)
  }

  get maxMessageLength (): number {
    return this._maxMessageLength
  }

  set maxMessageLength (value: number) {
    this._maxMessageLength = value
    SqlChannels.updateChannelInDb(this)
  }

  get minCooldown (): number {
    return this._minCooldown
  }

  set minCooldown (value: number) {
    this._minCooldown = value
    SqlChannels.updateChannelInDb(this)
  }
}

export class SqlChannels {
  private readonly _sqlChannels: Map<number, SqlChannel> = new Map<number, SqlChannel>()

  private constructor () {
  }

  hasChannel (roomId: number | string): boolean {
    return this._sqlChannels.has(SqlChannels.idToNumber(roomId))
  }

  getChannel (roomId: number | string): SqlChannel | undefined {
    return this._sqlChannels.get(SqlChannels.idToNumber(roomId))
  }

  addChannel (sqlChannel: SqlChannel) {
    this._sqlChannels.set(SqlChannels.idToNumber(sqlChannel.roomId), sqlChannel)
  }

  deleteChannel (sqlChannel: SqlChannel) {
    this._sqlChannels.delete(SqlChannels.idToNumber(sqlChannel.roomId))
  }

  getAllRoomIds (): number[] {
    return Array.from(this._sqlChannels.keys())
  }

  static async getChannels (): Promise<SqlChannels> {
    const [rows, fields]: [RowDataPacket[], FieldPacket[]] = await Sql.query<RowDataPacket[]>(`
        SELECT roomId, channelName, isTwitchPartner, maxMessageLength, minCooldown
        FROM channels
        WHERE enabled = b'1';`)

    const sqlChannels = new SqlChannels()

    for (const row of rows) {
      sqlChannels.addChannel(new SqlChannel(row.roomId, row.channelName, row.isTwitchPartner, row.maxMessageLength, row.minCooldown))
    }

    return sqlChannels
  }

  static addOrUpdateChannel (roomId: number | string, channelName: string, isTwitchPartner: boolean, maxMessageLength: number, minCooldown: number) {
    Sql.query(`INSERT INTO channels (roomId, channelName, isTwitchPartner, maxMessageLength, minCooldown)
               VALUES (?, ?, ?, ?, ?)
               ON DUPLICATE KEY UPDATE channelName      = channelName,
                                       isTwitchPartner  = isTwitchPartner,
                                       maxMessageLength = maxMessageLength,
                                       minCooldown      = minCooldown;
    `, [roomId, channelName, isTwitchPartner, maxMessageLength, minCooldown])
  }

  static updateChannelInDb (channel: SqlChannel): void {
    SqlChannels.addOrUpdateChannel(channel.roomId, channel.channelName, channel.isTwitchPartner, channel.maxMessageLength, channel.minCooldown)
  }

  private static idToNumber (id: string | number): number {
    return typeof id === "number" ? id : parseInt(id)
  }
}

