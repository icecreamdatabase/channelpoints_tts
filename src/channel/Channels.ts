"use strict"
import util from "util"
import {Channel} from "./Channel"
import {SqlChannels} from "../sql/channel/SqlChannels"
import {Bot} from "../Bot"
import EventEmitter from "eventemitter3"

export class Channels extends EventEmitter {
  public static readonly eventNameUpdate = "update"
  public static readonly eventNameJoin = "join"
  public static readonly eventNamePart = "part"
  public static readonly eventNameNameChange = "nameChange"
  private readonly channelRefreshInterval: number = 30000 //30 seconds
  private readonly _bot: Bot;
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
    const channelArr = await SqlChannels.getChannels()
    for (const channel of channelArr) {
      this.addOrUpdateChannel(Channel.FromISqlChannel(this.bot, channel))
    }
    this.emit(Channels.eventNameUpdate)
  }

  public hasChannel (roomId: number): boolean {
    return this._sqlChannels.has(roomId)
  }

  public getChannel (roomId: number): Channel | undefined {
    return this._sqlChannels.get(roomId)
  }

  public getAllChannels (): IterableIterator<Channel> {
    return this._sqlChannels.values()
  }

  public getAllRoomIds (): number[] {
    return Array.from(this._sqlChannels.keys())
  }

  public getAllChannelNames (): string[] {
    return Array.from(this._sqlChannels.values()).map(value => value.channelName)
  }

  public addOrUpdateChannel (newChannel: Channel): void {
    if (this._sqlChannels.has(newChannel.roomId)) {
      const existingChannel = this.getChannel(newChannel.roomId)
      if (existingChannel) {
        if (existingChannel.channelName !== newChannel.channelName) {
          this.emit(Channels.eventNameNameChange, existingChannel.channelName, newChannel.channelName)
          //existingChannel.channelName = newChannel.channelName
        }
        existingChannel.updateDbSettingsFromOtherChannel(newChannel)
      } else {
        throw new Error(`Channel exists but can't be fetched!?: \n${util.inspect(newChannel)}`)
      }
    } else {
      this.addChannelToMap(newChannel)
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

  public addNewWithDefaults (roomId: number, channelName: string, isTwitchPartner: boolean): void {
    this.addOrUpdateChannel(new Channel(this.bot, roomId, channelName, isTwitchPartner))
  }
}

