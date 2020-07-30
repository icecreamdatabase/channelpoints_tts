"use strict"

import {EventEmitter} from "eventemitter3"

import {ApiHelix, ApiKraken, ApiOther, Authentication} from "./api/Api"
import {UserIdLoginCache} from "./helper/UserIdLoginCache"
import {SqlGlobalUserBlacklist} from "./sql/main/SqlGlobalUserBlacklist"

import {Channels} from "./channel/Channels"
import {Irc} from "./irc/Irc"
import {PubSub} from "./pubsub/PubSub"
import {Logger} from "./helper/Logger";

const UPDATE_GLOBAL_USER_BLACKLIST_INTERVAL = 120000 // 2 minutes

export class Bot extends EventEmitter {
  private readonly initErrorRestartDelay = 15000
  public readonly eventNameRefresh = 'refresh'
  public readonly eventNameBotReady = 'ready'
  /* The order of these matter! */
  /* Auth needs to be first! */
  public authentication: Authentication = new Authentication(this);
  private _userIdLoginCache: UserIdLoginCache = new UserIdLoginCache(this);
  private _apiHelix: ApiHelix = new ApiHelix(this)
  private _apiKraken: ApiKraken = new ApiKraken(this)
  private _apiOther: ApiOther = new ApiOther(this)
  private _channels: Channels = new Channels(this)
  private _irc: Irc = new Irc(this);
  private _pubSub: PubSub = new PubSub(this);
  private readonly _globalUserBlacklist: Set<number> = new Set<number>();

  constructor () {
    super()

    setInterval(this.updateGlobalUserBlacklist.bind(this), UPDATE_GLOBAL_USER_BLACKLIST_INTERVAL)
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

      const promiseUserIdLoginCache = this.userIdLoginCache.init()
      const promiseIrc = this.irc.init()
      //Doesn't matter which of the two are finished first. But both have to finish before channels can run it's init.
      await Promise.all([promiseUserIdLoginCache, promiseIrc])

      await this.channels.init()


      Logger.info("Bot fully started.")
      this.emit(this.eventNameBotReady)
    } catch (e) {
      Logger.error(`Error during bot startup.:\n${e}\n\n\nTrying again in ${this.initErrorRestartDelay} seconds`)
      setTimeout(() => process.abort(), this.initErrorRestartDelay)
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

  public get apiOther (): ApiOther { // Do we never need the instance? The instance only exists for the supinic api ping
    return this._apiOther
  }

  public get channels (): Channels {
    return this._channels
  }

  public get irc () {
    if (this._irc === undefined) {
      throw new Error("Bot: irc is undefined!")
    }
    return this._irc
  }

  public get pubSub () {
    if (this._pubSub === undefined) {
      throw new Error("Bot: pubSub is undefined!")
    }
    return this._pubSub
  }

  public get userId () {
    return this.authentication.userId
  }

  public get userName () {
    return this.authentication.userName
  }

  public isUserIdInBlacklist (userId: number): boolean {
    return this._globalUserBlacklist.has(userId)
  }

  public async addUserIdToBlacklist (userId: number | string) {
    SqlGlobalUserBlacklist.addUserId(userId)
    await this.updateGlobalUserBlacklist()
  }

  public async updateGlobalUserBlacklist () {
    (await SqlGlobalUserBlacklist.getUserIds()).forEach(item => this._globalUserBlacklist.add(item))
  }
}



