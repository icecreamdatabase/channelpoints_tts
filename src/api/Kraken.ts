"use strict"
import Axios, {Method} from "axios"

import {Bot} from "../Bot"
import {Logger} from "../helper/Logger"
import {TimeConversion} from "../Enums"

import {
  IKrakenError,
  IKrakenUser,
  IKrakenUsers,
  IKrakenUsersChat,
  IKrakenUsersChatChannel,
  IKrakenChannel,
  IKrakenChannels,
  IKrakenStream,
  IKrakenStreams,
  IKrakenChannelVideo,
  IKrakenChannelVideos,
  IKrakenFollowsChannel
} from "./IKraken"

//TODO: use custom axois instances https://www.npmjs.com/package/axios


export class Kraken {
  private readonly _bot: Bot

  constructor (bot: Bot) {
    this._bot = bot
  }

  private get bot () {
    return this._bot
  }

  private async request<T> (pathAppend: string, method: Method = 'GET'): Promise<T/* | IKrakenError*/> {
    try {
      const result = await Axios({
        url: `https://api.twitch.tv/kraken/${pathAppend}`,
        method: method,
        headers: {
          'Accept': 'application/vnd.twitchtv.v5+json',
          'Client-ID': this.bot.authentication.clientId,
          'Authorization': `OAuth ${this.bot.authentication.accessToken}`
        }
      })
      return result.data
    } catch (e) {
      Logger.warn(e)
      //throw new Error(e)
      return e.response.data
    }
  }

  /**
   * Gets info about current live broadcast for channelID
   */
  public async streamInfo (channelID: number | string): Promise<IKrakenStreams> {
    return await this.request<IKrakenStreams>(`streams/${channelID}`)
  }

  /**
   * Get an array with info of past 100 broadcast vods
   */
  public async getVods (channelID: number | string): Promise<IKrakenChannelVideos> {
    return await this.request<IKrakenChannelVideos>(`channels/${channelID}/videos?broadcast_type=archive&limit=100`)
  }

  //TODO: cleanup of duplicated stuff
  /**
   * receive login name from a single userid
   */
  public async loginFromUserId (userId: number | string): Promise<string> {
    const response = await this.userInfo(userId)
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
  public async userIdFromLogin (username: string): Promise<number | string> {
    const response = await this.userInfosFromLogins([username])

    if (response._total === 0 || response.users.length === 0) {
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
  public async userDataFromIds (userIds: number[] | string[]): Promise<IKrakenUser[]> {
    const chunkSize = 100
    let users: IKrakenUser[] = []

    const requestChunks: (number[] | string[])[] = []

    for (let i = 0; i < userIds.length; i += chunkSize) {
      requestChunks.push(userIds.slice(i, i + chunkSize))
    }

    //let requestChunks = [].concat.apply([], userIds.map((elem: string, i: number) => i % chunkSize ? [] : [userIds.slice(i, i + chunkSize)]))

    for (const chunk of requestChunks) {
      const responseChunk = await this.userInfosFromIds(chunk)
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
  public async userDataFromLogins (usernames: string[]): Promise<IKrakenUser[]> {
    const chunkSize = 100
    let users: IKrakenUser[] = []

    const requestChunks: string[][] = []

    for (let i = 0; i < usernames.length; i += chunkSize) {
      requestChunks.push(usernames.slice(i, i + chunkSize))
    }

    //let requestChunks = [].concat.apply([], usernames.map((elem, i) => i % chunkSize ? [] : [usernames.slice(i, i + chunkSize)]))

    for (const chunk of requestChunks) {
      const responseChunk = await this.userInfosFromLogins(chunk)
      if (responseChunk._total > 0) {
        users = users.concat(responseChunk.users)
      }
    }
    return users
  }

  /**
   * Return the userInfo from an array of ids
   * max 100 entries are allowed
   */
  private async userInfosFromIds (ids: number[] | string[]): Promise<IKrakenUsers> {
    return await this.request('users?id=' + ids.join(','))
  }

  /**
   * Return the userInfo from an array of usernames
   * max 100 entries are allowed
   */
  private async userInfosFromLogins (usernames: string[]): Promise<IKrakenUsers> {
    usernames.map((entry: string) => entry.replace(/#/, ''))
    return await this.request('users?login=' + usernames.join(','))
  }

  /**
   * Accesses kraken/users/userID/chat
   */
  public async userInfo (userId: number | string): Promise<IKrakenUsersChat> {
    return await this.request('users/' + userId + '/chat')
  }

  /**
   * Accesses kraken/users/userID/chat/channels/roomID
   */
  public async userInChannelInfo (userId: number | string, roomId: number | string): Promise<IKrakenUsersChatChannel> {
    return await this.request('users/' + userId + '/chat/channels/' + roomId)
  }

  /**
   * Accesses kraken/channels/roomId
   */
  public async channelInfo (roomId: number | string): Promise<IKrakenChannel> {
    return await this.request('channels/' + roomId)
  }

  /**
   * Get Channel objects for an array of roomIds
   */
  private async channelInfos (roomIds: number[] | string[]): Promise<IKrakenChannels> {
    return await this.request('channels?id=' + roomIds.join(','))
  }

  /**
   * Get Channel objects for an array of roomIds
   */
  public async channelInfosFromIds (roomIds: number[] | string[]): Promise<IKrakenChannel[]> {
    const chunkSize = 100
    let channels: IKrakenChannel[] = []

    const requestChunks: (number[] | string[])[] = []

    for (let i = 0; i < roomIds.length; i += chunkSize) {
      requestChunks.push(roomIds.slice(i, i + chunkSize))
    }

    //let requestChunks = [].concat.apply([], roomIds.map((elem, i) => i % chunkSize ? [] : [roomIds.slice(i, i + chunkSize)]))

    for (const chunk of requestChunks) {
      const responseChunk = await this.channelInfos(chunk)
      if (responseChunk["_total"] > 0) {
        channels = channels.concat(responseChunk["channels"])
      }
    }
    return channels
  }

  public async followTime (userId: number | string, roomId: number | string): Promise<{ followDate: Date | undefined, followTimeMs: number, followTimeS: number, followtimeMin: number, followtimeH: number, followtimeD: number, followtimeMon: number, followtimeY: number }> {
    const response = await this.request<IKrakenFollowsChannel>('users/' + userId + '/follows/channels/' + roomId).catch(e => Logger.log(e))
    Logger.log(response)
    const returnObj = {
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
    const userData = await this.userInChannelInfo(userId, roomId)
    let isBroadcaster = false
    let isMod = false
    let isVip = false
    let isSubscriber = false
    for (const badge of userData.Badges) {
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
    const isAny = isBroadcaster || isMod || isVip
    const isKnownBot = userData.is_known_bot || false
    const isVerifiedBot = userData.is_verified_bot || false

    return {isBroadcaster, isMod, isVip, isAny, isSubscriber, isKnownBot, isVerifiedBot}
  }
}

