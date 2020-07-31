"use strict"

import {ISqlChannel, SqlChannels} from "../sql/channel/SqlChannels"
import {Bot} from "../Bot"
import {ApiOther} from "../api/Api"
import {UserLevels} from "../Enums"

export class Channel {
  private readonly _bot: Bot;
  private readonly _roomId: number;
  private _channelName: string;
  private _isTwitchPartner: boolean;
  private _maxMessageLength: number;
  private _minCooldown: number;

  private _botStatus: UserLevels = UserLevels.DEFAULT

  //private channelpointsSettinsg: ...
  private channelUserBlacklist: Set<number> = new Set<number>()


  public constructor (bot: Bot, roomId: number, channelName: string, isTwitchPartner: boolean, maxMessageLength: number, minCooldown: number) {
    this._bot = bot
    this._roomId = roomId
    this._channelName = channelName
    this._isTwitchPartner = isTwitchPartner
    this._maxMessageLength = maxMessageLength
    this._minCooldown = minCooldown

    this.bot.on(this.bot.eventNameRefresh, () => this.refresh())
  }

  get botStatus (): UserLevels {
    return this._botStatus
  }

  set botStatus (value: UserLevels) {
    this._botStatus = value
  }

  /**
   * Use this like an overloaded constructor.
   * @constructor
   */
  public static FromISqlChannel (bot: Bot, channel: ISqlChannel): Channel {
    return new Channel(bot,
      channel.roomId,
      channel.channelName,
      channel.isTwitchPartner,
      channel.maxMessageLength,
      channel.minCooldown
    )
  }

  private async refresh () {
    const channelStillExists = await SqlChannels.updateChannelFromDb(this)
    if (!channelStillExists) {
      //TODO: delete self somehow?!?
      this.bot.channels.deleteChannel(this) //is this really a good idea?
    }
  }

  private get bot (): Bot {
    return this._bot
  }

  public get roomId (): number {
    return this._roomId
  }

  public get channelName (): string {
    return this._channelName
  }

  public set channelName (value: string) {
    if (this._channelName !== value) {
      this._channelName = value
      SqlChannels.updateChannelInDb(this).then()
    }
  }

  public get isTwitchPartner (): boolean {
    return this._isTwitchPartner
  }

  public set isTwitchPartner (value: boolean) {
    if (this._isTwitchPartner !== value) {
      this._isTwitchPartner = value
      SqlChannels.updateChannelInDb(this).then()
    }
  }

  public get maxMessageLength (): number {
    return this._maxMessageLength
  }

  public set maxMessageLength (value: number) {
    if (this._maxMessageLength !== value) {
      this._maxMessageLength = value
      SqlChannels.updateChannelInDb(this).then()
    }
  }

  public get minCooldown (): number {
    return this._minCooldown
  }

  public set minCooldown (value: number) {
    if (this._minCooldown !== value) {
      this._minCooldown = value
      SqlChannels.updateChannelInDb(this).then()
    }
  }

  public async getChatters (): Promise<string[]> {
    return await ApiOther.getAllUsersInChannel(this.channelName)
  }
}

