"use strict"

import {Bot} from "../../Bot"
import {IPrivMsg} from "./IIrcTags"
import {Logger} from "../../helper/Logger"
import {UserLevels} from "../../Enums"
import {UserLevelsHelper} from "../../helper/UserLevelsHelper"
import {UserInChannelHelper} from "../../helper/UserInChannelHelper"

export interface IMessageObject {
  raw: IPrivMsg,
  roomId: number,
  channelName: string
  userId: number,
  username: string,
  message: string
  isACTION: boolean,
  userLevel: UserLevels
}

export class PrivMsg {
  private readonly _bot: Bot

  constructor (bot: Bot) {
    this._bot = bot

  }

  public async init (): Promise<void> {

    this.bot.irc.ircConnector.on('PRIVMSG', this.onChat.bind(this))
  }

  private get bot (): Bot {
    return this._bot
  }

  /**
   * Method from bot.TwitchIRCconnection event emitter 'PRIVMSG'.
   */
  private async onChat (obj: IPrivMsg): Promise<boolean> {
    const messageObj = this.createRawMessageObj(obj)
    messageObj.message += " "

    if (this.bot.isUserIdInBlacklist(messageObj.userId)) {
      //Logger.debug(`User on blacklist: ${messageObj.username} (${messageObj.userId}) - Channel: ${messageObj.channel} (${messageObj.roomId})`)
      return true
    }

    if (messageObj.message.toLowerCase().startsWith("!tts gdpr optout ")) {
      await this.bot.addUserIdToBlacklist(messageObj.userId)
      Logger.info(`User added blacklist: ${messageObj.username} (${messageObj.userId}) - Channel: ${messageObj.channelName} (${messageObj.roomId})`)
      this.bot.irc.ircConnector.sayWithMsgObj(messageObj, `@${messageObj.username}, You will now be completely ignored by the bot. Please give a few seconds for it to fully apply.`)
      return true
    }

    const channelObj = this.bot.channels.getChannel(messageObj.roomId)

    if (!channelObj) {
      //DiscordLog.error(`PRIVMSG without channelObj ${messageObj.roomId}\n\n${util.inspect(messageObj)}`)
      return false
    }

    // If a user has typed in the channel, they must be present even if the chatterlist doesn't show them yet
    UserInChannelHelper.addUsersToUserWasInChannelObj(messageObj.channelName, messageObj.username)

    Logger.info(`${this.bot.userId} (${this.bot.userName}) <-- ${messageObj.channelName} ${messageObj.username}: ${messageObj.message}`)

    //hardcoded always first
    //if (this.hardcoded.handle(messageObj)) {
    //  return true
    //}

    //await this.channelPoints.handlePrivMsg(messageObj)

    return false
  }

  /**
   * Creates the raw none handled messageObj from the raw irc object
   */
  private createRawMessageObj (privMsgObj: IPrivMsg): IMessageObject {
    const msgObj: IMessageObject = {
      raw: privMsgObj,
      roomId: parseInt(privMsgObj.tags['room-id']),
      channelName: privMsgObj.param,
      userId: parseInt(privMsgObj.tags['user-id']),
      username: privMsgObj.tags['display-name'],
      message: privMsgObj.trailing,
      isACTION: false,
      userLevel: UserLevels.DEFAULT
    }
    msgObj.userLevel = this.getUserLevel(msgObj)
    //Deal with /me messages
    if (msgObj.message.startsWith("\u0001ACTION")) {
      msgObj.message = msgObj.message.substring(8, msgObj.message.length - 1)
      msgObj.isACTION = true
    }
    //This makes it easier to check for .startsWith("!command ") and doesn't affect actual message memes
    msgObj.message += " "
    return msgObj
  }

  /**
   * Determines and sets userlevel inside of messageObj
   */
  private getUserLevel (messageObj: IMessageObject): UserLevels {
    if (this.bot.authentication.botOwners.includes(messageObj.userId)) {
      return UserLevels.BOTOWNER
    } else if (this.bot.authentication.botAdmins.includes(messageObj.userId)) {
      return UserLevels.BOTADMIN
    }

    return UserLevelsHelper.getUserLevel(messageObj.raw.tags.badges)
  }
}
