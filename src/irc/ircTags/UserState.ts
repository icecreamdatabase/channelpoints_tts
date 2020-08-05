"use strict"

import {Bot} from "../../Bot"
import {IUserState} from "./IIrcTags"
import {UserLevelsHelper} from "../../helper/UserLevelsHelper"

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
   */
  async onUserState (userState: IUserState): Promise<boolean> {
    // update own botStatus in a specific channel
    const roomId = await this.bot.userIdLoginCache.nameToId(userState.param.substr(1))
    if (roomId && this.bot.channels.has(roomId)) {
      const channel = this.bot.channels.get(roomId) // do we really need both the has check and the getChanel handling?
      if (channel) {
        channel.botStatus = UserLevelsHelper.getUserLevel(userState.tags.badges)
      }
    }

    return true
  }
}
