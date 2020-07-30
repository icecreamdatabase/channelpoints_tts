"use strict"
import {Bot} from "../Bot";
import {Logger} from "./Logger";
import {Channels} from "../channel/Channels";
import {SqlChannels} from "../sql/channel/SqlChannels";

//const SqlChannels = require('./../sql/main/SqlChannels')

const CLEANUPINTERVAL = 10800000 //3 hours


export class UserIdLoginCache {
  private readonly _bot: Bot
  private static userNameById: Map<number, string> = new Map<number, string>()
  private static userIdByName: Map<string, number> = new Map<string, number>()

  constructor (bot: Bot) {
    this._bot = bot

    setInterval(this.updateMaps.bind(this), CLEANUPINTERVAL)

    this.bot.on(this.bot.eventNameRefresh, () => this.updateMaps())
    this.bot.on(this.bot.eventNameRefresh, () => this.checkNameChanges())
  }

  public async init (): Promise<void> {
    await this.preloadFromChannels()
    await this.checkNameChanges()
  }

  private get bot () {
    return this._bot
  }

  public async preloadFromChannels (): Promise<void> {
    for (const channel of this.bot.channels.getAllChannels()) {
      UserIdLoginCache.userNameById.set(channel.roomId, channel.channelName)
      UserIdLoginCache.userIdByName.set(channel.channelName.toLowerCase(), channel.roomId)
    }
  }

  async checkNameChanges (): Promise<void> {
    let users = await this.bot.apiKraken.userDataFromIds(this.bot.channels.getAllRoomIds())
    for (let user of users) {
      if (UserIdLoginCache.userNameById.has(parseInt(user._id, 10))
        && UserIdLoginCache.userNameById.get(parseInt(user._id, 10)) !== user.name) {
        // Person must have changed their name
        Logger.debug(`############################################################`)
        Logger.debug(`${user._id} changed their name: ${UserIdLoginCache.userNameById.get(parseInt(user._id, 10))} --> ${user.name}`)
        Logger.debug(`############################################################`)
        const channel = await this.bot.channels.getChannel(parseInt(user._id, 10))
        if (channel) {
          channel.channelName = user.name
        }
      }
    }
    await this.preloadFromChannels()
  }

  async prefetchListOfIds (ids: number[]): Promise<void> {
    let users = await this.bot.apiKraken.userDataFromIds(ids)
    for (let user of users) {
      UserIdLoginCache.userNameById.set(parseInt(user._id, 10), user.name)
      UserIdLoginCache.userIdByName.set(user.name.toLowerCase(), parseInt(user._id, 10))
    }
  }

  async idToName (id: number): Promise<undefined | string> {
    if (!UserIdLoginCache.userNameById.has(id)) {
      let users = await this.bot.apiKraken.userDataFromIds([id])
      if (users.length > 0) {
        let user = users[0]
        UserIdLoginCache.userNameById.set(parseInt(user._id, 10), user.name)
        UserIdLoginCache.userIdByName.set(user.name.toLowerCase(), parseInt(user._id, 10))
      } else {
        Logger.debug(`idToName failed with id: ${id}\nChannel is probably banned.`)
        return undefined
      }
    }

    return UserIdLoginCache.userNameById.get(id)
  }

  async nameToId (name: string): Promise<undefined | number> {
    name = name.toLowerCase().trim()
    //Get rid of channelnamne #
    if (name.charAt(0) === "#") {
      name = name.substr(1)
    }
    if (!UserIdLoginCache.userIdByName.has(name)) {
      let users = await this.bot.apiKraken.userDataFromLogins([name])
      if (users.length > 0) {
        let user = users[0]
        UserIdLoginCache.userNameById.set(parseInt(user._id, 10), user.name)
        UserIdLoginCache.userIdByName.set(user.name.toLowerCase(), parseInt(user._id, 10))
      } else {
        Logger.debug(`nameToId failed with name: ${name}\nChannel is probably banned.`)
        return undefined
      }
    }

    return UserIdLoginCache.userIdByName.get(name)
  }

  async updateMaps () {
    let currentIds = Array.from(UserIdLoginCache.userNameById.keys())
    UserIdLoginCache.userNameById.clear()
    UserIdLoginCache.userIdByName.clear()
    await this.prefetchListOfIds(currentIds)
    //await this.checkNameChanges() // this is included in updateBotChannels currently
    //await this.bot.channels.updateFromDb() // is this needed?
    Logger.debug(`Refreshed UserIdLoginCache. ${this.bot.userId} (${this.bot.userName}) is currently tracking ${Object.keys(UserIdLoginCache.userNameById).length} ids.`)
  }
}

