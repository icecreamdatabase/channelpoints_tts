"use strict"

import {Bot} from "../../Bot"
import {IClearChat} from "./IIrcTags"
import {DiscordLog} from "../../helper/DiscordLog"
import {Logger} from "../../helper/Logger"

export class ClearChat {
  private readonly _bot: Bot
  private static lastTimeoutObj: Map<string, Map<string, number>> = new Map<string, Map<string, number>>()

  constructor (bot: Bot) {
    this._bot = bot
  }

  public async init (): Promise<void> {
    this.bot.irc.ircConnector.on('CLEARCHAT', this.onClearChat.bind(this))
  }

  private get bot (): Bot {
    return this._bot
  }

  /**
   * Method from bot.TwitchIRCconnection event emitter 'CLEARCHAT'.
   */
  async onClearChat (clearChatObj: IClearChat): Promise<void> {
    const channelName: string = clearChatObj.param.substring(1).toLowerCase()
    const userName: string = clearChatObj.trailing.toLowerCase()
    const roomId: number = parseInt(clearChatObj.tags["room-id"])

    if (!ClearChat.lastTimeoutObj.has(channelName)) {
      ClearChat.lastTimeoutObj.set(channelName, new Map<string, number>())
    }
    ClearChat.lastTimeoutObj.get(channelName)?.set(userName, parseInt(clearChatObj.tags["tmi-sent-ts"]))

    // Detect perm ban of own bot account
    if (parseInt(clearChatObj.tags["target-user-id"]) === this.bot.userId
      && !Object.prototype.hasOwnProperty.call(clearChatObj.tags, "ban-duration")) {
      DiscordLog.info(`${this.bot.userName} got banned in #${channelName}`)
      Logger.info(`${this.bot.userName} got banned in #${channelName}`)

      if (this.bot.channels.has(roomId)) {
        DiscordLog.custom("tts-status-log", "Ban:", channelName, DiscordLog.getDecimalFromHexString("#FFFF00"))
        await this.bot.channels.get(roomId)?.drop() //TODO: We can't do this if money is involved!
        await this.bot.channels.updateFromDb()
        await this.bot.irc.ircConnector.sendWhisper(channelName, `This bot has left your channel because it got banned by a moderator. If you want to use the bot again you simply have to unban it, wait one minute and register again.`)
        DiscordLog.custom("tts-status-log", "Part:", channelName, DiscordLog.getDecimalFromHexString("#FF0000"))
      }
    }
  }

  /**
   * Check if a user was timed out before in a channel.
   */
  static wasTimedOut (channelName: string, userName: string, secondsAgo = 10): boolean {
    if (channelName.startsWith("#")) {
      channelName = channelName.substring(1)
    }
    return (ClearChat.lastTimeoutObj.get(channelName.toLowerCase())?.get(userName.toLowerCase()) || 0) + secondsAgo * 1000 > Date.now()
  }
}
