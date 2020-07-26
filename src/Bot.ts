"use strict"

import {EventEmitter} from "eventemitter3";

import {Helix, Kraken, Other, Authentication} from "./api/Api";
import {UserIdLoginCache} from "./helper/UserIdLoginCache";
import {SqlGlobalUserBlacklist} from "./sql/main/SqlGlobalUserBlacklist";


//CLASSES
//const SqlBlacklist = require('./sql/main/SqlUserBlacklist')
//const UserIdLoginCache = require('./helper/UserIdLoginCache')
//const Irc = require('./irc/Irc')
//const PubSub = require('./pubsub/PubSub')

const UPDATE_USERBLACKLIST_INTERVAL = 120000 // 2 minutes
const SUPINIC_API_PING_INTERVAL = 1800000 // 30 minutes

export class Bot extends EventEmitter {
  public readonly refreshEventName = 'refresh'
  private _globalUserBlacklist: number[] | string[] = [];
  private _userIdLoginCache?: UserIdLoginCache;
  private _helix?: Helix
  private _kraken?: Kraken
  private _irc?: Irc;
  private _pubSub?: PubSub;
  public authentication: Authentication;

  constructor () {
    super()

    setInterval(this.updateUserBlacklist.bind(this), UPDATE_USERBLACKLIST_INTERVAL)
    // noinspection JSIgnoredPromiseFromCall
    this.updateUserBlacklist()

    this.on(this.refreshEventName, this.updateUserBlacklist.bind(this))
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
    // @ts-ignore TODO: No clue how to fix this
    return this._globalUserBlacklist.includes(parseInt(userId))
  }

  public async addUserIdToBlacklist (userId: number | string) {
    SqlGlobalUserBlacklist.addUserId(userId)
    await this.updateUserBlacklist()
  }

  public async updateUserBlacklist () {
    this._globalUserBlacklist = await SqlGlobalUserBlacklist.getUserIds()
  }
}



