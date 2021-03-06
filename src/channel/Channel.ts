"use strict"

import {SqlChannels} from "../sql/channel/SqlChannels"
import {Bot} from "../Bot"
import {ApiOther} from "../api/Api"
import {UserLevels} from "../Enums"

export class Channel {
  private readonly _bot: Bot
  private readonly _roomId: number
  private _channelName: string

  private static readonly _defaultMaxIrcMessageLength = 450
  private static readonly _defaultMinCooldown = 0
  private static readonly _defaultTimeoutCheckTime = 2
  private static readonly _defaultIrcMuted = false
  private static readonly _defaultIsQueueMessages = true
  private static readonly _defaultVolume = 100
  private static readonly _defaultAllModsAreEditors = true
  private static readonly _defaultIsTwitchPartner = false

  private _botStatus: UserLevels = UserLevels.DEFAULT

  public constructor (bot: Bot,
                      roomId: number,
                      channelName: string) {
    this._bot = bot
    this._roomId = roomId
    this._channelName = channelName
  }

  get botStatus (): UserLevels {
    return this._botStatus
  }

  set botStatus (value: UserLevels) {
    this._botStatus = value
  }

  public async disable (): Promise<void> {
    await this.bot.channels.disableChannel(this) //is this really a good idea?
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
      SqlChannels.updateChannelName(this.roomId, this.channelName).then()
    }
  }

  public async getIsTwitchPartner (): Promise<boolean> {
    return (await SqlChannels.get(this.roomId))?.isTwitchPartner || Channel._defaultIsTwitchPartner
  }

  public async getMaxIrcMessageLength (): Promise<number> {
    return (await SqlChannels.get(this.roomId))?.maxIrcMessageLength || Channel._defaultMaxIrcMessageLength
  }

  public async getMinCooldown (): Promise<number> {
    return (await SqlChannels.get(this.roomId))?.minCooldown || Channel._defaultMinCooldown
  }

  public async getTimeoutCheckTime (): Promise<number> {
    return (await SqlChannels.get(this.roomId))?.timeoutCheckTime || Channel._defaultTimeoutCheckTime
  }

  public async getIrcMuted (): Promise<boolean> {
    return (await SqlChannels.get(this.roomId))?.ircMuted || Channel._defaultIrcMuted
  }

  public async getIsQueueMessages (): Promise<boolean> {
    return (await SqlChannels.get(this.roomId))?.isQueueMessages || Channel._defaultIsQueueMessages
  }

  public async getVolume (): Promise<number> {
    return (await SqlChannels.get(this.roomId))?.volume || Channel._defaultVolume
  }

  public async getAllModsAreEditors (): Promise<boolean> {
    return (await SqlChannels.get(this.roomId))?.allModsAreEditors || Channel._defaultAllModsAreEditors
  }

  public async getChatters (): Promise<string[]> {
    return await ApiOther.getAllUsersInChannel(this.channelName)
  }
}

