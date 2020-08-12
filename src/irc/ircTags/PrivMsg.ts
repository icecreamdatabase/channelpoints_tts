"use strict"

import {Bot} from "../../Bot"
import {IPrivMsg} from "./IIrcTags"
import {Logger} from "../../helper/Logger"
import {UserLevels} from "../../Enums"
import {UserLevelsHelper} from "../../helper/UserLevelsHelper"
import {UserInChannelHelper} from "../../helper/UserInChannelHelper"
import {Hardcoded} from "../commands/Hardcoded"
import {Commands} from "../commands/Commands"
import {CustomRewards} from "../commands/CustomRewards"
import {Channel} from "../../channel/Channel"

export interface IMessageObject {
  raw: IPrivMsg,
  roomId: number,
  channelName: string
  userId: number,
  username: string,
  message: string
  isACTION: boolean,
  userLevel: UserLevels,
  timestamp: Date,
  channelObj: Channel
}

export class PrivMsg {
  private readonly _bot: Bot
  private readonly _hardcoded: Hardcoded
  private readonly _commands: Commands
  private readonly _customRewards: CustomRewards

  constructor (bot: Bot) {
    this._bot = bot
    this._hardcoded = new Hardcoded(this.bot)
    this._commands = new Commands(this.bot)
    this._customRewards = new CustomRewards(this.bot)
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
    try {
      const msgObj = await this.createRawMessageObj(obj)

      if (this.bot.isUserIdInBlacklist(msgObj.userId)) {
        return true
      }

      if (msgObj.channelObj.isUserIdInBlacklist(msgObj.userId)) {
        return true
      }

      if (msgObj.message.toLowerCase().startsWith("!tts gdpr optout ")) {
        await this.bot.addUserIdToBlacklist(msgObj.userId)
        Logger.info(`User added blacklist: ${msgObj.username} (${msgObj.userId}) - Channel: ${msgObj.channelName} (${msgObj.roomId})`)
        await this.bot.irc.ircConnector.sayWithMsgObj(msgObj, `@${msgObj.username}, You will now be completely ignored by the bot. Please give a few seconds for it to fully apply.`)
        return true
      }

      // If a user has typed in the channel, they must be present even if the chatterlist doesn't show them yet
      UserInChannelHelper.addUsersToUserWasInChannelObj(msgObj.channelName, msgObj.username)

      Logger.info(`${this.bot.userId} (${this.bot.userName}) <-- ${msgObj.channelName} ${msgObj.username}: ${msgObj.message}`)

      if (await this._hardcoded.handle(msgObj)) {
        return true
      }

      await this._commands.handle(msgObj)

      await this._customRewards.handle(msgObj)

    } catch (e) {
      Logger.debug(e)
      // ignore
    }
    return false
  }

  /**
   * Creates the raw none handled messageObj from the raw irc object
   */
  private async createRawMessageObj (privMsgObj: IPrivMsg): Promise<IMessageObject> {
    const roomId = parseInt(privMsgObj.tags["room-id"])
    const channelObj = await this.bot.channels.get(roomId)
    if (channelObj === undefined) {
      throw new Error()
    }

    const msgObj: IMessageObject = {
      raw: privMsgObj,
      roomId: roomId,
      channelName: privMsgObj.param,
      userId: parseInt(privMsgObj.tags['user-id']),
      username: privMsgObj.tags['display-name'],
      message: privMsgObj.trailing + " ",
      isACTION: false,
      userLevel: UserLevels.DEFAULT,
      timestamp: new Date(parseInt(privMsgObj.tags["tmi-sent-ts"], 10)),
      channelObj: channelObj
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
