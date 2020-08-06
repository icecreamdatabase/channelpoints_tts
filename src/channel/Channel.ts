"use strict"

import {ISqlChannel, SqlChannels} from "../sql/channel/SqlChannels"
import {Bot} from "../Bot"
import {ApiOther} from "../api/Api"
import {UserLevels} from "../Enums"
import {SqlChannelUserBlacklist} from "../sql/channel/SqlChannelUserBlacklist"

export class Channel {
  private readonly _bot: Bot
  private readonly _roomId: number
  private _channelName: string
  private _isTwitchPartner: boolean
  private _maxMessageLength: number
  private _minCooldown: number
  private _ircMuted: boolean
  private _isQueueMessages: boolean
  private _volume: number
  private _canModsChangeSettings: boolean

  private static readonly _defaultMaxMessageLength = 450
  private static readonly _defaultMinCooldown = 0
  private static readonly _defaultIrcMuted = false
  private static readonly _defaultIsQueueMessages = true
  private static readonly _defaultVolume = 100
  private static readonly _defaultCanModsChangeSettings = true

  private _botStatus: UserLevels = UserLevels.DEFAULT

  //private channelpointsSettinsg: ...
  private _channelUserBlacklist: Set<number> = new Set<number>()


  public constructor (bot: Bot,
                      roomId: number,
                      channelName: string,
                      isTwitchPartner: boolean,
                      maxMessageLength: number = Channel._defaultMaxMessageLength,
                      minCooldown: number = Channel._defaultMinCooldown,
                      ircMuted: boolean = Channel._defaultIrcMuted,
                      isQueueMessages: boolean = Channel._defaultIsQueueMessages,
                      volume: number = Channel._defaultVolume,
                      canModsChangeSettings: boolean = Channel._defaultCanModsChangeSettings) {
    this._bot = bot
    this._roomId = roomId
    this._channelName = channelName
    this._isTwitchPartner = isTwitchPartner
    this._maxMessageLength = maxMessageLength
    this._minCooldown = minCooldown
    this._ircMuted = ircMuted
    this._isQueueMessages = isQueueMessages
    this._volume = volume
    this._canModsChangeSettings = canModsChangeSettings

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
      channel.minCooldown,
      channel.ircMuted,
      channel.isQueueMessages,
      channel.volume,
      channel.canModsChangeSettings
    )
  }

  private async refresh () {
    // TODO: Not sure if this is a good idea if we got a billion channels. One Sql request per channel? Rather do this in Channels
    const channelStillExists = await SqlChannels.updateChannelFromDb(this)
    if (!channelStillExists) {
      await this.drop()
    }
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

  public get ircMuted (): boolean {
    return this._ircMuted
  }

  public set ircMuted (value: boolean) {
    if (this._ircMuted !== value) {
      this._ircMuted = value
      SqlChannels.updateChannelInDb(this).then()
    }
  }

  public get isQueueMessages (): boolean {
    return this._isQueueMessages
  }

  public set isQueueMessages (value: boolean) {
    if (this._isQueueMessages !== value) {
      this._isQueueMessages = value
      SqlChannels.updateChannelInDb(this).then()
    }
  }

  public get volume (): number {
    return this._volume
  }

  public set volume (value: number) {
    if (this._volume !== value) {
      this._volume = value
      SqlChannels.updateChannelInDb(this).then()
    }
  }

  public get canModsChangeSettings (): boolean {
    return this._canModsChangeSettings
  }

  public set canModsChangeSettings (value: boolean) {
    if (this._canModsChangeSettings !== value) {
      this._canModsChangeSettings = value
      SqlChannels.updateChannelInDb(this).then()
    }
  }

  public updateDbSettingsFromOtherChannel (other: Channel | ISqlChannel): void {
    this._channelName = other.channelName
    this._isTwitchPartner = other.isTwitchPartner
    this._maxMessageLength = other.maxMessageLength
    this._minCooldown = other.minCooldown
    this._ircMuted = other.ircMuted
    this._isQueueMessages = other.isQueueMessages
    this._volume = other.volume
    this._canModsChangeSettings = other.canModsChangeSettings
    SqlChannels.updateChannelInDb(this).then()
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
  }
}

