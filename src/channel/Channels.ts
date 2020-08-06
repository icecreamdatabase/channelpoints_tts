"use strict"
import util from "util"
import {Channel} from "./Channel"
import {SqlChannels} from "../sql/channel/SqlChannels"
import {Bot} from "../Bot"
import EventEmitter from "eventemitter3"

export class Channels extends EventEmitter {
  public static readonly eventNameUpdate = Symbol("update")
  public static readonly eventNameJoin = Symbol("join")
  public static readonly eventNamePart = Symbol("part")
  public static readonly eventNameNameChange = Symbol("nameChange")
  private readonly channelRefreshInterval: number = 30000 //30 seconds
  private readonly _bot: Bot
  private readonly _sqlChannels: Map<number, Channel> = new Map<number, Channel>()

  constructor (bot: Bot) {
    super()
    this._bot = bot
    setInterval(() => this.updateFromDb(), this.channelRefreshInterval)
    this.bot.on(this.bot.eventNameRefresh, () => this.updateFromDb())
  }

  public async init (): Promise<void> {
    await this.updateFromDb()
  }

  private get bot (): Bot {
    return this._bot
  }

  public async updateFromDb (): Promise<void> {
    const channelMap = await SqlChannels.getBasicChannelData()
    for (const channel of channelMap) {
      this.addOrUpdateChannel(channel[0], channel[1])
    }
    this.emit(Channels.eventNameUpdate)
  }

  public has (roomId: number): boolean {
    return this._sqlChannels.has(roomId)
  }

  public get (roomId: number): Channel | undefined {
    return this._sqlChannels.get(roomId)
  }

  public getAll (): IterableIterator<Channel> {
    return this._sqlChannels.values()
  }

  public getAllRoomIds (): number[] {
    return Array.from(this._sqlChannels.keys())
  }

  public getAllChannelNames (): string[] {
    return Array.from(this._sqlChannels.values()).map(value => value.channelName)
  }

  public addOrUpdateChannel (roomId: number, channelName: string): void {
    if (this._sqlChannels.has(roomId)) {
      const existingChannel = this.get(roomId)
      if (existingChannel) {
        if (existingChannel.channelName !== channelName) {
          this.emit(Channels.eventNameNameChange, existingChannel.channelName, channelName)
          //existingChannel.channelName = newChannel.channelName
        }
        existingChannel.channelName = channelName
      } else {
        throw new Error(`Channel exists but can't be fetched!?: \n${roomId} (${channelName})`)
      }
    } else {
      this.addChannelToMap(new Channel(this.bot, roomId, channelName))
    }
  }

  private addChannelToMap (channel: Channel): void {
    this._sqlChannels.set(channel.roomId, channel)
    this.emit(Channels.eventNameJoin, channel.channelName)
  }

  public deleteChannelFromMap (channel: Channel): void {
    this._sqlChannels.delete(channel.roomId)
    this.emit(Channels.eventNamePart, channel.channelName)
  }

  public async dropChannel (channel: Channel): Promise<void> {
    this.deleteChannelFromMap(channel)
    await SqlChannels.dropChannel(channel.roomId)
  }
}

