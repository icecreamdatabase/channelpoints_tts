"use strict"
import util from "util"
import {Logger} from "../helper/Logger";
import {Channel} from "./Channel";
import {SqlChannels} from "../sql/channel/SqlChannels";
import {Bot} from "../Bot";

export class Channels {
  private readonly channelRefreshInterval: number = 30000 //30 seconds
  private readonly _bot: Bot;
  private readonly _sqlChannels: Map<number, Channel> = new Map<number, Channel>()

  constructor (bot: Bot) {
    this._bot = bot;
    this.updateFromDb().then()
    setInterval(() => this.updateFromDb(), this.channelRefreshInterval)
    this.bot.on(this.bot.eventNameRefresh, () => this.updateFromDb())
  }

  public async init (): Promise<void> {
    await this.updateFromDb()
  }

  private get bot (): Bot {
    return this._bot;
  }

  public async updateFromDb () {
    const channelArr = await SqlChannels.getChannels()
    for (const channel of channelArr) {
      this.addOrUpdateChannel(Channel.FromISqlChannel(this.bot, channel))
    }
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

  getAllRoomIds (): number[] {
    return Array.from(this._sqlChannels.keys())
  }

  public addOrUpdateChannel (newChannel: Channel): void {
    if (this._sqlChannels.has(newChannel.roomId)) {
      const channel = this.getChannel(newChannel.roomId)
      if (channel) {
        channel.channelName = newChannel.channelName
        channel.isTwitchPartner = newChannel.isTwitchPartner
        channel.maxMessageLength = newChannel.maxMessageLength
        channel.minCooldown = newChannel.minCooldown
      } else {
        throw new Error(`Channel exists but can't be fetched!?: \n${util.inspect(newChannel)}`)
      }
    } else {
      this.addChannel(newChannel)
    }
  }

  private addChannel (channel: Channel): void {
    this._sqlChannels.set(channel.roomId, channel)

    //TODO: trigger irc join
  }

  deleteChannel (sqlChannel: Channel): void {
    this._sqlChannels.delete(sqlChannel.roomId)

    //TODO: trigger irc leave
  }
}

