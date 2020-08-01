"use strict"

import {Bot} from "../../Bot"
import {UserLevels} from "../../Enums"
import {IUserState, IUserStateTags} from "./IIrcTags";

export class UserState {
  private readonly _bot: Bot

  constructor (bot: Bot) {
    this._bot = bot
  }

  public async init (): Promise<void> {
    this.bot.irc.ircConnector.on('USERSTATE', this.onUserState.bind(this))
  }

  private get bot (): Bot {
    return this._bot
  }

  /**
   * Method from bot.TwitchIRCconnection event emitter 'USERSTATE'.
   * @param obj raw object from TwitchIRCconnection registerEvents
   * @returns {Promise<boolean>} Was action taken
   */
  async onUserState (obj: IUserState): Promise<boolean> {
    // update own botStatus in a specific channel
    const roomId = await this.bot.userIdLoginCache.nameToId(obj.param.substr(1))
    if (roomId && this.bot.channels.hasChannel(roomId)) {
      const channel = this.bot.channels.getChannel(roomId) // do we really need both the hasChannel check and the getChanel handling?
      if (channel) {
        channel.botStatus = UserState.getUserLevel(obj.tags)
      }
    }

    return true
  }

  private static getUserLevel (tagsObj: IUserStateTags): UserLevels {
    // If no badges are supplied the badges object gets parsed into "true"
    if (typeof tagsObj.badges !== "string") {
      return UserLevels.DEFAULT
    }

    const badgeSplit: string[] = tagsObj.badges.split(",")
    const badgeSplitUserLevels: UserLevels[] = <UserLevels[]>badgeSplit.map(x => {
      const badgeName: string = x.split("/")[0].toUpperCase()
      // If it's a valid key in UserLevels return the UserLevels value. Else return undefined which get filtered later on.
      if (badgeName in UserLevels) {
        return UserLevels[<keyof typeof UserLevels>badgeName]
      }
    }).filter(Boolean) // <-- This removes all undefined from the array. It makes UserLevels[] out of (UserLevels | undefined)
    badgeSplitUserLevels.push(UserLevels.DEFAULT)
    return Math.max(...badgeSplitUserLevels)
  }
}
