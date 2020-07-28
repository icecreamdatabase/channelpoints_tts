"use strict"
import util from "util"
import {Logger} from "../helper/Logger";
import {Channel} from "./Channel";
import {SqlChannels} from "../sql/channel/SqlChannels";
import {Bot} from "../Bot";

export class Channels {
  private readonly _bot: Bot;
  private readonly _sqlChannels: Map<number, Channel> = new Map<number, Channel>()

  constructor (bot: Bot) {
    this._bot = bot;
    this.updateAll().then()
  }

  public get bot (): Bot {
    return this._bot;
  }

  public async updateAll () {
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

  private addChannel (channel: Channel): void {
    this._sqlChannels.set(channel.roomId, channel)

    //TODO: trigger irc join
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

  deleteChannel (sqlChannel: Channel): void {
    this._sqlChannels.delete(sqlChannel.roomId)

    //TODO: trigger irc leave
  }

  getAllRoomIds (): number[] {
    return Array.from(this._sqlChannels.keys())
  }
}

