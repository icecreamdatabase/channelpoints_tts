"use strict"

import {EventEmitter} from "eventemitter3";

import {Authentication} from "./api/Authentication";

//CLASSES
const SqlBlacklist = require('./sql/main/SqlUserBlacklist')
const Api = require('./api/Api')
const UserIdLoginCache = require('./helper/UserIdLoginCache')
const Irc = require('./irc/Irc')
const PubSub = require('./pubsub/PubSub')

const UPDATE_USERBLACKLIST_INTERVAL = 120000 // 2 minutes
const SUPINIC_API_PING_INTERVAL = 1800000 // 30 minutes

export class Bot extends EventEmitter {
  public readonly refreshEventName = 'refresh'
  private userBlacklist: number[] | string[] = [];
  private _userIdLoginCache: undefined;
  private _api: undefined;
  private _irc: undefined;
  private _pubSub: undefined;
  private authentication: Authentication;

  constructor () {
    super()

    setInterval(this.updateUserBlacklist.bind(this), UPDATE_USERBLACKLIST_INTERVAL)
    // noinspection JSIgnoredPromiseFromCall
    this.updateUserBlacklist()

    this.on(this.refreshEventName, this.updateUserBlacklist.bind(this))
    this.authentication = new Authentication(this, () => this.onAuthReady())
  }

  get userIdLoginCache () {
    return this._userIdLoginCache
  }

  get api () {
    return this._api
  }

  get irc () {
    return this._irc
  }

  get pubSub () {
    return this._pubSub
  }

  onAuthReady () {
    this._userIdLoginCache = new UserIdLoginCache(this)
    this._api = new Api(this)

    setInterval(this.api.other.constructor.supinicApiPing.bind(this, this.authentication.supinicApiUser, this.authentication.supinicApiKey), SUPINIC_API_PING_INTERVAL)

    this._irc = new Irc(this)
    this._pubSub = new PubSub(this)
  }

  get userId () {
    return this.authentication.userId
  }

  get userName () {
    return this.authentication.userName
  }

  isUserIdInBlacklist (userId: number | string): boolean {
    return this.userBlacklist.includes(parseInt(userId))
  }

  async addUserIdToBlacklist (userId: number | string) {
    SqlBlacklist.addUserId(userId)
    await this.updateUserBlacklist()
  }

  async updateUserBlacklist () {
    this.userBlacklist = await SqlBlacklist.getUserIds()
  }
}



