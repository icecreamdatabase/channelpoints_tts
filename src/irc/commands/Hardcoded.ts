"use strict"
import util from "util"
// noinspection ES6UnusedImports
import si from "systeminformation"
import {UserLevels} from "../../Enums"
import {Logger} from "../../helper/Logger"
import {Bot} from "../../Bot"
import {DiscordLog} from "../../helper/DiscordLog"
import {IMessageObject} from "../ircTags/PrivMsg"
import {ApiOther} from "../../api/Api"

//CLASSES

export class Hardcoded {
  private readonly _bot: Bot
  private static readonly BATCH_MAX_FACTOR = 0.8 // limit of 100 * 0.8 = 80 messages per chunk
  private static readonly BATCH_DELAY_BETWEEN_CHUNKS = 30000 //m
  private static readonly BATCH_DEFAULT_LIMIT = 250


  constructor (bot: Bot) {
    this._bot = bot
  }

  /**
   * @return {Bot}
   */
  private get bot () {
    return this._bot
  }

  public async handle (messageObj: IMessageObject): Promise<boolean> {
    if (messageObj.userLevel >= UserLevels.BOTADMIN
      && messageObj.message.startsWith("<r ")) {

      this.bot.emit(this.bot.eventNameRefresh)
      await this.bot.irc.ircConnector.sayWithMsgObj(messageObj, "Reloaded everything FeelsGoodMan")
      return true
    }

    if (messageObj.userLevel >= UserLevels.BOTADMIN
      && messageObj.message.startsWith("<t ")) {
      //const ttsSettingsObject = this.bot.irc.privMsg.channelPoints.getSettingObj(messageObj.roomId)
      //if (ttsSettingsObject) {
      //  TtsWebSocket.sendTts(messageObj, ttsSettingsObject, messageObj.message.substr(messageObj.message.indexOf(" ") + 1))
      //}
      return true
    }

    if (messageObj.userLevel >= UserLevels.BROADCASTER
      && messageObj.message.startsWith("<tags ")) {

      DiscordLog.debug(JSON.stringify(messageObj, null, 2))
      await this.bot.irc.ircConnector.sayWithMsgObj(messageObj, "@" + messageObj.username + ", Done.")
      return true
    }

    /* Shutting down the bot */
    if (messageObj.userLevel >= UserLevels.BOTOWNER
      && messageObj.message.startsWith("<s ")) {

      //TODO: make this high priority "first in queue" again
      await this.bot.irc.ircConnector.sayWithBoth(messageObj.roomId, messageObj.channelName, "Shutting down FeelsBadMan")
      setTimeout(function () {
        process.abort()
      }, 1200)
      return true
    }

    /* eval */
    if (messageObj.userLevel >= UserLevels.BOTOWNER
      && messageObj.message.startsWith("<eval ")) {

      let msg: string
      const evalString = messageObj.message.split(" ").slice(1).join(" ")
      //Logger.log(evalString)
      if (evalString) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const ss = async (x: string) => {
            await this.bot.irc.ircConnector.sayWithMsgObj(messageObj, x.toString())
          }
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const so = async (x: Record<string, unknown>) => {
            await this.bot.irc.ircConnector.sayWithMsgObj(messageObj, util.inspect(x))
          }
          msg = (eval(evalString) || "").toString()
        } catch (err) {
          msg = err.message
        }

        if (["mysql", "identity", "oauth", "host", "password", "appid", "waAppid"].find(
          x => msg.toLowerCase().includes(x) || evalString.toLowerCase().includes(x)
        )) {
          Logger.warn("Eval match: " + msg)
          msg = "***"
        }

      } else {
        msg = messageObj.username + ", Nothing to eval given..."
      }
      await this.bot.irc.ircConnector.sayWithMsgObj(messageObj, msg)
    }

    /* batchsay */
    if (messageObj.userLevel >= UserLevels.BOTOWNER
      && messageObj.message.startsWith("<batchsay ")) {
      const msgSplit = messageObj.message.split(' ')
      const url = msgSplit[1]
      let sameConnection = false
      try {
        sameConnection = JSON.parse(msgSplit[2])
      } catch (e) {
        //ignore
      }

      if (url) {
        const body: string = await ApiOther.getWebsiteContent(url)
        await this.batchSay(messageObj.roomId, messageObj.channelName, body.split(/(?:\n|\r\n)+/g), undefined, sameConnection)
      }
    }

    return false
  }

  /**
   * Say an array of strings.
   */
  async batchSay (roomId: number, channelName: string, messages: string[], batchLimit: number = Hardcoded.BATCH_DEFAULT_LIMIT, useSameSendConnectionForAllMessages = false): Promise<void> {
    const channelObj = this.bot.channels.get(roomId)
    if (!channelObj) {
      return
    }

    let botStatus = channelObj.botStatus || UserLevels.DEFAULT
    let messageInChunkCount = 0
    let currentLimit = botStatus >= UserLevels.VIP
      ? this.bot.irc.rateLimitModerator
      : this.bot.irc.rateLimitUser
    currentLimit = Math.min(currentLimit * Hardcoded.BATCH_MAX_FACTOR, batchLimit)
    let totalMessagesSent = 0

    Logger.info(`New limit: ${currentLimit}`)
    for (const message of messages) {
      if (messageInChunkCount >= currentLimit) {
        messageInChunkCount = 0

        // update limit
        const channelObj = this.bot.channels.get(roomId)
        if (channelObj) {
          botStatus = channelObj.botStatus || UserLevels.DEFAULT
          currentLimit = botStatus >= UserLevels.VIP
            ? this.bot.irc.rateLimitModerator
            : this.bot.irc.rateLimitUser
          currentLimit = Math.min(currentLimit * Hardcoded.BATCH_MAX_FACTOR, batchLimit)
        }

        Logger.info(`New limit: ${currentLimit}`)
        Logger.info(`${totalMessagesSent}/${messages.length} sent`)
        Logger.info(`Starting pause for: ${Hardcoded.BATCH_DELAY_BETWEEN_CHUNKS / 1000}s`)
        await new Promise(resolve => setTimeout(resolve, Hardcoded.BATCH_DELAY_BETWEEN_CHUNKS))
      }

      await this.bot.irc.ircConnector.sayWithBoth(roomId, channelName, message, useSameSendConnectionForAllMessages)
      messageInChunkCount++
      totalMessagesSent++
    }
    Logger.info("Done")
  }
}

