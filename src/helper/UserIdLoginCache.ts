"use strict"
import {Bot} from "../Bot";
import {Logger} from "./Logger";

//const SqlChannels = require('./../sql/main/SqlChannels')

const CLEANUPINTERVAL = 10800000 //3 hours


export class UserIdLoginCache {
  private readonly _bot: Bot
  private userInfosById: Record<number | string, string> = {}
  private userInfosByName: Record<string, number | string> = {}

  constructor (bot: Bot) {
    this._bot = bot

    setInterval(this.updateMaps.bind(this), CLEANUPINTERVAL)

    this.bot.on(this.bot.refreshEventName, this.updateMaps.bind(this))
  }

  /**
   * @return {Bot}
   */
  get bot () {
    return this._bot
  }

  async prefetchFromDatabase (): Promise<void> {
    let channels = await SqlChannels.getChannelData(this.bot.userId)
    for (let currentId in channels) {
      if (Object.prototype.hasOwnProperty.call(channels, currentId)) {
        let channel = channels[currentId]
        this.userInfosById[channel.channelID] = channel.channelName
        this.userInfosByName[channel.channelName.toLowerCase()] = channel.channelID
      }
    }
  }

  async checkNameChanges (): Promise<void> {
    let channelIdsFromDb = Object.keys(await SqlChannels.getChannelData(this.bot.userId))
    let users = await this.bot.kraken.userDataFromIds(channelIdsFromDb)
    for (let user of users) {
      if (this.userInfosById[user._id] !== undefined
        && this.userInfosById[user._id] !== user.name) {
        // Person must have changed their name
        Logger.debug(`############################################################`)
        Logger.debug(`${user._id} changed their name: ${this.userInfosById[user._id]} --> ${user.name}`)
        Logger.debug(`############################################################`)
        await SqlChannels.updateUserNameIfExists(user._id, user.name)
      }
    }
    await this.prefetchFromDatabase()
  }

  async prefetchListOfIds (ids: string[] | number[]): Promise<void> {
    let users = await this.bot.kraken.userDataFromIds(ids)
    for (let user of users) {
      this.userInfosById[user["_id"]] = user.name
      this.userInfosByName[user["name"].toLowerCase()] = user["_id"]
    }
  }

  async idToName (id: string | number): Promise<undefined | string> {
    if (!Object.prototype.hasOwnProperty.call(this.userInfosById, id)) {
      let users = await this.bot.kraken.userDataFromIds([id])
      if (users.length > 0) {
        let user = users[0]
        this.userInfosById[user._id] = user.name
        this.userInfosByName[user.name.toLowerCase()] = user._id
      } else {
        Logger.debug(`idToName failed with id: ${id}\nChannel is probably banned.`)
        return undefined
      }
    }

    return this.userInfosById[id]
  }

  async nameToId (name: string): Promise<undefined | number | string> {
    name = name.toLowerCase().trim()
    //Get rid of channelnamne #
    if (name.charAt(0) === "#") {
      name = name.substr(1)
    }
    if (!Object.prototype.hasOwnProperty.call(this.userInfosByName, name)) {
      let users = await this.bot.kraken.userDataFromLogins([name])
      if (users.length > 0) {
        let user = users[0]
        this.userInfosById[user._id] = user.name
        this.userInfosByName[user.name.toLowerCase()] = user._id
      } else {
        Logger.debug(`nameToId failed with name: ${name}\nChannel is probably banned.`)
        return undefined
      }
    }

    return this.userInfosByName[name]
  }

  async updateMaps () {
    let currentIds = Object.keys(this.userInfosById)
    this.userInfosById = {}
    this.userInfosByName = {}
    await this.prefetchListOfIds(currentIds)
    //await this.checkNameChanges() // this is included in updateBotChannels currently
    await this.bot.irc.updateBotChannels()
    Logger.debug(`Refreshed UserIdLoginCache. ${this.bot.userId} (${this.bot.userName}) is currently tracking ${Object.keys(this.userInfosById).length} ids.`)
  }
}

