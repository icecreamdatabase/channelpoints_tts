"use strict"
import Axios, {Method} from "axios"

import {Bot} from "../Bot";
import {Logger} from "../helper/Logger";
import {TimeConversion} from "../Enums";

import {
  IKrakenUsersChat,
  IKrakenUsersChatChannel,
  IKrakenChannel,
  IKrakenChannels,
  IKrakenFollowsChannel
} from "./IKraken"

//TODO: use custom axois instances https://www.npmjs.com/package/axios


export class Kraken {
  private readonly _bot: Bot;

  constructor (bot: Bot) {
    this._bot = bot
  }

  /**
   * @return {Bot}
   */
  get bot () {
    return this._bot
  }

  async request (pathAppend: string, method: Method = 'GET'): Promise<any> {
    try {
      let result = await Axios({
        url: `https://api.twitch.tv/kraken/${pathAppend}`,
        method: method,
        headers: {
          'Accept': 'application/vnd.twitchtv.v5+json',
          'Client-ID': this.bot.authentication.clientId,
          'Authorization': `OAuth ${this.bot.authentication.accessToken}`,
        }
      })
      return result.data
    } catch (e) {
      Logger.info(e)
    }
    return {}
  }

  /**
   * Gets info about current live broadcast for channelID
   */
  async streamInfo (channelID: number | string): Promise<any> {
    return await this.request(`streams/${channelID}`)
  }

  /**
   * Get an array with info of past 100 broadcast vods
   */
  async getVods (channelID: number | string): Promise<any> {
    return await this.request(`channels/${channelID}/videos?broadcast_type=archive&limit=100`)
  }

//TODO: cleanup of duplicated stuff
  /**
   * receive login name from a single userid
   */
  async loginFromUserId (userId: number | string): Promise<any> {
    let response = await this.userInfo(userId)
    if (Object.hasOwnProperty.call(response, 'login')) {
      return response.login
    } else {
      return ""
    }
  }

//TODO: cleanup of duplicated stuff
  /**
   * Returns the userId from a single login
   */
  async userIdFromLogin (username: string): Promise<number | string> {
    let response: { total: number, users: { _id: number | string }[] } = await this.userInfosFromLogins([username])

    if (response.total === 0 || response.users.length === 0) {
      return '-1'
    } else {
      return response.users[0]["_id"]
    }
  }

//TODO: cleanup of duplicated stuff
  /**
   * Returns the userInfo from an array of usernames
   * directly returns the ["users"]
   * automatically handles if more than 100 usernames are requested
   */
  async userDataFromIds (ids: string[]): Promise<object[]> {
    let chunkSize = 100
    let users: object[] = []
    let requestChunks = [].concat.apply([], ids.map((elem: string, i: number) => i % chunkSize ? [] : [ids.slice(i, i + chunkSize)]))

    for (let chunk of requestChunks) {
      let responseChunk = await this.userInfosFromIds(chunk)
      if (responseChunk && responseChunk["_total"] > 0) {
        users = users.concat(responseChunk["users"])
      }
    }
    return users
  }

//TODO: cleanup of duplicated stuff
  /**
   * Returns the userInfo from an array of ids
   * directly returns the ["users"]
   * automatically handles if more than 100 usernames are requested
   */
  async userDataFromLogins (usernames: string[]): Promise<object[]> {
    let chunkSize = 100
    let users: object[] = []
    let requestChunks = [].concat.apply([], usernames.map((elem, i) => i % chunkSize ? [] : [usernames.slice(i, i + chunkSize)]))

    for (let chunk of requestChunks) {
      let responseChunk = await this.userInfosFromLogins(chunk)
      if (responseChunk["_total"] > 0) {
        users = users.concat(responseChunk["users"])
      }
    }
    return users
  }

  /**
   * Return the userInfo from an array of ids
   * max 100 entries are allowed
   */
  async userInfosFromIds (ids: string[]): Promise<object> {
    return await this.request('users?id=' + ids.join(','))
  }

  /**
   * Return the userInfo from an array of usernames
   * max 100 entries are allowed
   */
  async userInfosFromLogins (usernames: string[]): Promise<object> {
    usernames.map((entry) => {
      return entry.replace(/#/, '')
    })
    return await this.request('users?login=' + usernames.join(','))
  }


  /**
   * Users object returned by
   * kraken/users/XXXXXX/chat and
   * kraken/users/XXXXXX/chat/channels/YYYYYY
   *
   * @typedef {Object} Users
   * @property {string} id
   * @property {string} login
   * @property {string} displayName
   * @property {string} color
   * @property {boolean} isVerifiedBot
   * @property {boolean} isKnownBot
   * @property {Object} Badges
   */

  /**
   * Accesses the kraken/users/:userID/chat
   * Example: https://api.twitch.tv/kraken/users/38949074/chat?api_version=5
   * Example return:
   * {
   *   "id":"38949074",
   *   "login":"icdb",
   *   "displayName":"icdb",
   *   "color":"#00FF00",
   *   "isVerifiedBot":false,
   *   "isKnownBot":false,
   *   "badges":[]
   * }
   * @param  {String|int} userId The userID to check for
   * @return {Users} [description]
   */
  async userInfo (userId) {
    return await this.request('users/' + userId + '/chat')
  }

  /**
   * Accesses kraken/users/userID/chat/channels/roomID
   */
  async userInChannelInfo (userId: number | string, roomId: number | string): Promise<IKrakenUsersChatChannel> {
    return await this.request('users/' + userId + '/chat/channels/' + roomId)
  }

  /**
   * Accesses kraken/channels/roomId
   */
  async channelInfo (roomId: number | string): Promise<IKrakenChannel> {
    return await this.request('channels/' + roomId)
  }

  /**
   * Get Channel objects for an array of roomIds
   */
  async channelInfos (roomIds: number[] | string[]): Promise<IKrakenChannels> {
    return await this.request('channels?id=' + roomIds.join(','))
  }

  /**
   * Get Channel objects for an array of roomIds
   */
  async channelInfosFromIds (roomIds: number[] | string[]): Promise<IKrakenChannel[]> {
    let chunkSize = 100
    let users = []
    let requestChunks = [].concat.apply([], roomIds.map((elem, i) => i % chunkSize ? [] : [roomIds.slice(i, i + chunkSize)]))

    for (let chunk of requestChunks) {
      let responseChunk = await this.channelInfos(chunk)
      if (responseChunk["_total"] > 0) {
        users = users.concat(responseChunk["channels"])
      }
    }
    return users
  }

  async followTime (userId: number | string, roomId: number | string): Promise<{ followDate: Date | undefined, followTimeMs: number, followTimeS: number, followtimeMin: number, followtimeH: number, followtimeD: number, followtimeMon: number, followtimeY: number }> {
    let response: IKrakenFollowsChannel = await this.request('users/' + userId + '/follows/channels/' + roomId).catch(e => Logger.log(e))
    Logger.log(response)
    let returnObj = {
      followDate: new Date(0),
      followTimeMs: -1,
      followTimeS: -1,
      followtimeMin: -1,
      followtimeH: -1,
      followtimeD: -1,
      followtimeMon: -1,
      followtimeY: -1
    }
    if (response && Object.prototype.hasOwnProperty.call(response, "created_at")) {
      returnObj.followDate = new Date(response.created_at)
      returnObj.followTimeMs = Date.now() - returnObj.followDate.getTime()
      returnObj.followTimeS = Math.floor(returnObj.followTimeMs / 1000)
      returnObj.followtimeMin = Math.floor(returnObj.followTimeS / TimeConversion.MinuteToSeconds)
      returnObj.followtimeH = Math.floor(returnObj.followTimeS / TimeConversion.HourToSeconds)
      returnObj.followtimeD = Math.floor(returnObj.followTimeS / TimeConversion.DayToSeconds)
      returnObj.followtimeMon = Math.floor(returnObj.followTimeS / TimeConversion.MonthToSeconds)
      returnObj.followtimeY = Math.floor(returnObj.followTimeS / TimeConversion.YearToSeconds)
    }
    return returnObj
  }

  /**
   * Returns the userstate of a userId inside a room from the api
   */
  async userStatus (userId: number | string, roomId: number | string): Promise<{ isBroadcaster: boolean, isMod: boolean, isVip: boolean, isAny: boolean, isSubscriber: boolean, isKnownBot: boolean, isVerifiedBot: boolean }> {
    let userData = await this.userInChannelInfo(userId, roomId)
    let isBroadcaster = false
    let isMod = false
    let isVip = false
    let isSubscriber = false
    for (let badge of userData.Badges) {
      if (badge.id === "broadcaster") {
        isBroadcaster = true
      }
      if (badge.id === "moderator") {
        isMod = true
      }
      if (badge.id === "vip") {
        isVip = true
      }
      if (badge.id === "subscriber") {
        isSubscriber = true
      }
    }
    let isAny = isBroadcaster || isMod || isVip
    let isKnownBot = userData.is_known_bot || false
    let isVerifiedBot = userData.is_verified_bot || false

    return {isBroadcaster, isMod, isVip, isAny, isSubscriber, isKnownBot, isVerifiedBot}
  }
}
