"use strict"

import {EventEmitter} from "eventemitter3"

import {ApiHelix, ApiIcdbDev, ApiKraken, ApiOther, Authentication} from "./api/Api"
import {UserIdLoginCache} from "./helper/UserIdLoginCache"
import {SqlGlobalUserBlacklist} from "./sql/main/SqlGlobalUserBlacklist"

import {Channels} from "./channel/Channels"
import {Irc} from "./irc/Irc"
import {PubSub} from "./pubsub/PubSub"
import {Logger} from "./helper/Logger"


export class Bot extends EventEmitter {
  private static readonly initErrorRestartDelay = 15000 // 15 seconds
  private static readonly UPDATE_GLOBAL_USER_BLACKLIST_INTERVAL = 120000 // 2 minutes
  public readonly eventNameRefresh = Symbol('refresh')
  public readonly eventNameBotReady = Symbol('ready')
  public authentication: Authentication
  private readonly _userIdLoginCache: UserIdLoginCache
  private readonly _apiHelix: ApiHelix
  private readonly _apiKraken: ApiKraken
  private readonly _apiOther: ApiOther
  private readonly _apiIcdbDev: ApiIcdbDev
  private readonly _channels: Channels
  private readonly _irc: Irc
  private readonly _pubSub: PubSub
  private readonly _globalUserBlacklist: Set<number> = new Set<number>()

  constructor () {
    super()

    /* The order of these matter! */
    /* Auth needs to be first! */
    this.authentication = new Authentication(this)
    this._userIdLoginCache = new UserIdLoginCache(this)
    this._apiHelix = new ApiHelix(this)
    this._apiKraken = new ApiKraken(this)
    this._apiIcdbDev = new ApiIcdbDev(this)
    this._apiOther = new ApiOther(this)
    this._channels = new Channels(this)
    this._irc = new Irc(this)
    this._pubSub = new PubSub(this)

    setInterval(this.updateGlobalUserBlacklist.bind(this), Bot.UPDATE_GLOBAL_USER_BLACKLIST_INTERVAL)
    // noinspection JSIgnoredPromiseFromCall
    this.updateGlobalUserBlacklist()

    this.on(this.eventNameRefresh, this.updateGlobalUserBlacklist.bind(this))

    this.init().then()
  }

  private async init (): Promise<void> {
    try {
      // The order of these matter!
      // E.g.: auth is needed in later ones. irc is needed in order to join channels
      await this.authentication.init()

      await this.channels.init()
      await this.userIdLoginCache.init()
      await this.irc.init()

      Logger.info("Bot fully started.")
      this.emit(this.eventNameBotReady)
    } catch (e) {
      Logger.error(`Error during bot startup.:\n${e}\n\n\nTrying again in ${Bot.initErrorRestartDelay} seconds`)
      setTimeout(() => process.abort(), Bot.initErrorRestartDelay)
    }
  }

  public get userIdLoginCache (): UserIdLoginCache {
    return this._userIdLoginCache
  }

  public get apiHelix (): ApiHelix {
    return this._apiHelix
  }

  public get apiKraken (): ApiKraken {
    return this._apiKraken
  }

  public get apiIcdbDev (): ApiIcdbDev {
    return this._apiIcdbDev
  }

  public get apiOther (): ApiOther { // Do we never need the instance? The instance only exists for the supinic api ping
    return this._apiOther
  }

  public get channels (): Channels {
    return this._channels
  }

  public get irc (): Irc {
    if (this._irc === undefined) {
      throw new Error("Bot: irc is undefined!")
    }
    return this._irc
  }

  public get pubSub (): PubSub {
    if (this._pubSub === undefined) {
      throw new Error("Bot: pubSub is undefined!")
    }
    return this._pubSub
  }

  public get userId (): number {
    return this.authentication.userId
  }

  public get userName (): string {
    return this.authentication.userName
  }

  public isUserIdInBlacklist (userId: number): boolean {
    return this._globalUserBlacklist.has(userId)
  }

  public async addUserIdToBlacklist (userId: number): Promise<void> {
    SqlGlobalUserBlacklist.addUserId(userId)
    await this.updateGlobalUserBlacklist()
  }

  public async updateGlobalUserBlacklist (): Promise<void> {
    (await SqlGlobalUserBlacklist.getUserIds()).forEach(item => this._globalUserBlacklist.add(item))
  }
}



