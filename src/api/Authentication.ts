"use strict"
import Axios from "axios"
import util from "util"

import {Bot} from "../Bot";
import {SqlBotData} from "../sql/main/SqlBotData"
import {Logger} from "../helper/Logger";

//ENUMS
const TimeConversion = require('../../ENUMS/TimeConversion')

export class Authentication {
  private readonly _validateRefreshOffset = 120000 // 2 minutes
  private readonly _validateInterval = 900000 // 15 minutes
  private readonly _updateInterval = 300000 // 5 minutes

  private readonly _bot: Bot
  private _userId?: number | string
  private _userName?: string
  private _clientId?: string
  private _clientSecret?: string
  private _accessToken?: string
  private _refreshToken?: string
  private _supinicApiUser?: number | string
  private _supinicApiKey?: string

  constructor (bot: Bot, authReadyCb: () => void) {
    this._bot = bot

    setInterval(this.validate.bind(this), this._validateInterval)
    setInterval(this.update.bind(this), this._updateInterval)

    this.bot.on(this.bot.refreshEventName, this.update.bind(this))

    this.init().then(() => authReadyCb())
  }

  get bot (): Bot {
    return this._bot
  }

  get userId (): number | string {
    if (this._userId === undefined) {
      throw new Error("Auth: userId is undefined!")
    }
    return this._userId
  }

  get userName (): string {
    if (this._userName === undefined) {
      throw new Error("Auth: userName is undefined!")
    }
    return this._userName
  }

  get clientId (): string {
    if (this._clientId === undefined) {
      throw new Error("Auth: clientId is undefined!")
    }
    return this._clientId
  }

  get accessToken (): string {
    if (this._accessToken === undefined) {
      throw new Error("Auth: accessToken is undefined!")
    }
    return this._accessToken
  }

  get supinicApiUser (): number | string {
    if (this._supinicApiUser === undefined) {
      throw new Error("Auth: supinicApiUser is undefined!")
    }
    return this._supinicApiUser
  }

  get supinicApiKey (): string {
    if (this._supinicApiKey === undefined) {
      throw new Error("Auth: supinicapiKey is undefined!")
    }
    return this._supinicApiKey
  }

  async validate () {
    try {
      const result = await Axios({
        method: 'get',
        url: 'https://id.twitch.tv/oauth2/validate',
        headers: {
          'Authorization': `OAuth ${this.accessToken}`
        }
      });
      //Logger.debug(`^^^ Validated token for: ${this.userId} (${this.userName})`)
      if (result.data["expires_in"] < (this._validateInterval + this._validateRefreshOffset) / TimeConversion.SecondsToMilliseconds) {
        await this.refresh()
      }
    } catch (e) {
      if (Object.prototype.hasOwnProperty.call(e, "response")
        && e.response
        && Object.prototype.hasOwnProperty.call(e.response, "status")) {
        //if unauthorized (expired or wrong token) also this.refresh()
        if (e.response.status === 401) {
          Logger.info(`Unauthorized. Needs to refresh for ${this.bot.userName}`)
          await this.refresh()
        } else {
          Logger.warn(`Token validate errored for ${this.bot.userName}: \n${e.response.statusText}`)
        }
      } else {
        Logger.error(`Token validate errored for ${this.userName}:\n${e.response.statusText}`)
      }
    }
  }

  async refresh () {
    try {
      const result = await Axios({
        method: 'post',
        url: 'https://id.twitch.tv/oauth2/token',
        params: {
          'client_id': this.clientId,
          'client_secret': this._clientSecret,
          'grant_type': 'refresh_token',
          'refresh_token': this._refreshToken
        }
      });
      if (Object.prototype.hasOwnProperty.call(result.data, "access_token")) {
        await SqlBotData.set("access_token", result.data["access_token"])
        await this.update()
        Logger.debug(`Token refreshed for ${this.userName}`)
        return
      } else {
        Logger.warn(`Token refresh errored for ${this.userName} due to missing access_token in response:\n${util.inspect(result.data)}`)
      }
    } catch (e) {
      Logger.error(`Token refresh errored for ${this.userName}:\n${e.response.statusText}`)
    }
  }

  async revoke () {
    try {
      await Axios({
        method: 'post',
        url: 'https://id.twitch.tv/oauth2/revoke',
        params: {
          'client_id': this.clientId,
          'token': this.accessToken
        }
      })
      Logger.debug(`Token revoked for ${this.userName}`)
    } catch (e) {
      Logger.warn(`Token revoke for ${this.userName} errored: \n${e.response.statusText}`)
    }
  }

  async update () {
    const botData = await SqlBotData.getBotData()
    this._userId = botData.userId
    this._userName = botData.userName
    this._clientId = botData.clientId
    this._clientSecret = botData.clientSecret
    this._accessToken = botData.access_token
    this._refreshToken = botData.refresh_token
    this._supinicApiUser = botData.supinicApiUser
    this._supinicApiKey = botData.supinicApiKey
  }

  async init () {
    await this.update()
    // if this._authData is not {} --- update() will set it to {} if something failed. This should never happen!
    if (this.accessToken !== undefined) {
      await this.validate()
    } else {
      Logger.error(`An account has no valid auth data in the database!\n${this.userId}`)
    }
  }
}

