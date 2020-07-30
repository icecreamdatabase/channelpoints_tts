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
  public readonly eventNameRefresh = 'refresh'
  public readonly eventNameBotReady = 'ready'
  /* The order of these matter! */
  /* Auth needs to be first! */
  public authentication: Authentication = new Authentication(this, () => this.emit(this.eventNameBotReady));
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
    this.on(this.eventNameBotReady, () => this.onAuthReady())
  }

  onAuthReady () {
    Logger.info("Authentification done. Starting bot...")
  }

  get userIdLoginCache (): UserIdLoginCache {
    return this._userIdLoginCache
  }

  get apiHelix (): ApiHelix {
    return this._apiHelix
  }

  get apiKraken (): ApiKraken {
    return this._apiKraken
  }

  get apiOther (): ApiOther { // Do we never need the instance? The instance only exists for the supinic api ping
    return this._apiOther
  }

  get channels (): Channels {
    return this._channels
  }

  get irc () {
    if (this._irc === undefined) {
      throw new Error("Bot: irc is undefined!")
    }
    return this._irc
  }

  get pubSub () {
    if (this._pubSub === undefined) {
      throw new Error("Bot: pubSub is undefined!")
    }
    return this._pubSub
  }

  get userId () {
    return this.authentication.userId
  }

  get userName () {
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



