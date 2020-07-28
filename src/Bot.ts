"use strict"

import {EventEmitter} from "eventemitter3"

import {Helix, Kraken, Other, Authentication} from "./api/Api"
import {UserIdLoginCache} from "./helper/UserIdLoginCache"
import {SqlGlobalUserBlacklist} from "./sql/main/SqlGlobalUserBlacklist"

import {Channels} from "./channel/Channels"
import {Irc} from "./irc/Irc"
import {PubSub} from "./pubsub/PubSub"

const UPDATE_GLOBAL_USER_BLACKLIST_INTERVAL = 120000 // 2 minutes
const SUPINIC_API_PING_INTERVAL = 1800000 // 30 minutes

export class Bot extends EventEmitter {
  public readonly refreshEventName = 'refresh'
  private readonly _globalUserBlacklist: Set<number> = new Set<number>();
  private _userIdLoginCache?: UserIdLoginCache;
  private _helix?: Helix
  private _kraken?: Kraken
  private _channels: Channels = new Channels(this)
  private _irc?: Irc;
  private _pubSub?: PubSub;
  public authentication: Authentication;

  constructor () {
    super()

    setInterval(this.updateGlobalUserBlacklist.bind(this), UPDATE_GLOBAL_USER_BLACKLIST_INTERVAL)
    // noinspection JSIgnoredPromiseFromCall
    this.updateGlobalUserBlacklist()

    this.on(this.refreshEventName, this.updateGlobalUserBlacklist.bind(this))
    this.authentication = new Authentication(this, () => this.onAuthReady())
  }

  get userIdLoginCache () {
    if (this._userIdLoginCache === undefined) {
      throw new Error("Bot: userIdLoginCache is undefined!")
    }
    return this._userIdLoginCache
  }

  get helix (): Helix | undefined {
    if (this._helix === undefined) {
      throw new Error("Bot: helix is undefined!")
    }
    return this._helix
  }

  get kraken (): Kraken {
    if (this._kraken === undefined) {
      throw new Error("Bot: kraken is undefined!")
    }
    return this._kraken
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

  onAuthReady () {
    this._userIdLoginCache = new UserIdLoginCache(this)
    this._helix = new Helix(this)
    this._kraken = new Kraken(this)

    setInterval(() => Other.supinicApiPing(this.authentication.supinicApiUser, this.authentication.supinicApiKey), SUPINIC_API_PING_INTERVAL)

    this._irc = new Irc(this)
    this._pubSub = new PubSub(this)
  }

  get userId () {
    return this.authentication.userId
  }

  get userName () {
    return this.authentication.userName
  }

  public isUserIdInBlacklist (userId: number | string): boolean {
    return this._globalUserBlacklist.has(typeof userId === "number" ? userId : parseInt(userId))
  }

  public async addUserIdToBlacklist (userId: number | string) {
    SqlGlobalUserBlacklist.addUserId(userId)
    await this.updateGlobalUserBlacklist()
  }

  public async updateGlobalUserBlacklist () {
    (await SqlGlobalUserBlacklist.getUserIds()).forEach(item => this._globalUserBlacklist.add(item))
  }
}



