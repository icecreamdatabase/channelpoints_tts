"use strict"

import {SqlChannels} from "../sql/channel/SqlChannels"
import {Bot} from "../Bot"
import {ApiOther} from "../api/Api"
import {UserLevels} from "../Enums"
import {SqlChannelUserBlacklist} from "../sql/channel/SqlChannelUserBlacklist"

export class Channel {
  private static readonly UPDATE_BLACKLIST_INTERVAL = 120000 // 2 minutes

  private readonly _bot: Bot
  private readonly _roomId: number
  private _channelName: string

  private static readonly _defaultMaxMessageLength = 450
  private static readonly _defaultMinCooldown = 0
  private static readonly _defaultIrcMuted = false
  private static readonly _defaultIsQueueMessages = true
  private static readonly _defaultVolume = 100
  private static readonly _defaultCanModsChangeSettings = true
  private static readonly _defaultIsTwitchPartner = false

  private _botStatus: UserLevels = UserLevels.DEFAULT

  private _channelUserBlacklist: Set<number> = new Set<number>()


  public constructor (bot: Bot,
                      roomId: number,
                      channelName: string) {
    this._bot = bot
    this._roomId = roomId
    this._channelName = channelName

    this.updateChannelUserBlacklist().then()
  }

  get botStatus (): UserLevels {
    return this._botStatus
  }

  set botStatus (value: UserLevels) {
    this._botStatus = value
  }

  public async drop (): Promise<void> {
    await this.bot.channels.dropChannel(this) //is this really a good idea?
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

  public async getMaxMessageLength (): Promise<number> {
    return (await SqlChannels.get(this.roomId))?.maxMessageLength || Channel._defaultMaxMessageLength
  }

  public async getMinCooldown (): Promise<number> {
    return (await SqlChannels.get(this.roomId))?.minCooldown || Channel._defaultMinCooldown
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

  public async getCanModsChangeSettings (): Promise<boolean> {
    return (await SqlChannels.get(this.roomId))?.canModsChangeSettings || Channel._defaultCanModsChangeSettings
  }

  public async getChatters (): Promise<string[]> {
    return await ApiOther.getAllUsersInChannel(this.channelName)
  }

  public isUserIdInBlacklist (userId: number): boolean {
    return this._channelUserBlacklist.has(userId)
  }

  public async addUserIdToBlacklist (userId: number): Promise<void> {
    SqlChannelUserBlacklist.addUserId(this.roomId, userId)
    await this.updateChannelUserBlacklist()
  }

  public async updateChannelUserBlacklist (): Promise<void> {
    (await SqlChannelUserBlacklist.getUserIds(this.roomId)).forEach(item => this._channelUserBlacklist.add(item))

    setTimeout(() => this.updateChannelUserBlacklist(), Channel.UPDATE_BLACKLIST_INTERVAL * (Math.random() + 1))
  }
}

