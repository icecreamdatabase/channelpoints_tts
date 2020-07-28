"use strict"
import {Bot} from "../Bot";
import {Logger} from "./Logger";
import {IdHelper} from "./IdHelper";
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

    this.bot.on(this.bot.refreshEventName, this.updateMaps.bind(this))
  }

  /**
   * @return {Bot}
   */
  get bot () {
    return this._bot
  }

  async prefetchFromDatabase (): Promise<void> {
    const channels = await SqlChannels.getChannels()
    for (const channel of channels) {
      UserIdLoginCache.userNameById.set(IdHelper.IdToNumber(channel.roomId), channel.channelName)
      UserIdLoginCache.userIdByName.set(channel.channelName.toLowerCase(), IdHelper.IdToNumber(channel.roomId))
    }
  }

  async checkNameChanges (): Promise<void> {
    let users = await this.bot.kraken.userDataFromIds(this.bot.channels.getAllRoomIds())
    for (let user of users) {
      if (UserIdLoginCache.userNameById.has(IdHelper.IdToNumber(user._id))
        && UserIdLoginCache.userNameById.get(IdHelper.IdToNumber(user._id)) !== user.name) {
        // Person must have changed their name
        Logger.debug(`############################################################`)
        Logger.debug(`${user._id} changed their name: ${UserIdLoginCache.userNameById.get(IdHelper.IdToNumber(user._id))} --> ${user.name}`)
        Logger.debug(`############################################################`)
        const channel = await this.bot.channels.getChannel(IdHelper.IdToNumber(user._id))
        if (channel) {
          channel.channelName = user.name
        }
      }
    }
    await this.prefetchFromDatabase()
  }

  async prefetchListOfIds (ids: string[] | number[]): Promise<void> {
    let users = await this.bot.kraken.userDataFromIds(ids)
    for (let user of users) {
      UserIdLoginCache.userNameById.set(IdHelper.IdToNumber(user._id), user.name)
      UserIdLoginCache.userIdByName.set(user.name.toLowerCase(), IdHelper.IdToNumber(user._id))
    }
  }

  async idToName (id: string | number): Promise<undefined | string> {
    if (!UserIdLoginCache.userNameById.has(IdHelper.IdToNumber(id))) {
      let users = await this.bot.kraken.userDataFromIds([IdHelper.IdToNumber(id)])
      if (users.length > 0) {
        let user = users[0]
        UserIdLoginCache.userNameById.set(IdHelper.IdToNumber(user._id), user.name)
        UserIdLoginCache.userIdByName.set(user.name.toLowerCase(), IdHelper.IdToNumber(user._id))
      } else {
        Logger.debug(`idToName failed with id: ${id}\nChannel is probably banned.`)
        return undefined
      }
    }

    return UserIdLoginCache.userNameById.get(IdHelper.IdToNumber(id))
  }

  async nameToId (name: string): Promise<undefined | number | string> {
    name = name.toLowerCase().trim()
    //Get rid of channelnamne #
    if (name.charAt(0) === "#") {
      name = name.substr(1)
    }
    if (!UserIdLoginCache.userIdByName.has(name)) {
      let users = await this.bot.kraken.userDataFromLogins([name])
      if (users.length > 0) {
        let user = users[0]
        UserIdLoginCache.userNameById.set(IdHelper.IdToNumber(user._id), user.name)
        UserIdLoginCache.userIdByName.set(user.name.toLowerCase(), IdHelper.IdToNumber(user._id))
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
    await this.bot.channels.updateAll()
    Logger.debug(`Refreshed UserIdLoginCache. ${this.bot.userId} (${this.bot.userName}) is currently tracking ${Object.keys(UserIdLoginCache.userNameById).length} ids.`)
  }
}

