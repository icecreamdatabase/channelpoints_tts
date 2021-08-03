"use strict"
import {Bot} from "../../Bot"
import {IMessageObject} from "../ircTags/PrivMsg"
import {UserLevels} from "../../Enums"

// noinspection JSUnusedGlobalSymbols
enum TtsCmds {
  "info" = "This is a channelpoint based TTS system made by icdb. https://tts.icdb.dev",
  "help" = "This is the help command",
  "settings" = "The settings have moved over here PogChamp 👉 https://tts.icdb.dev/dashboard?c=",
  "voices" = "You can check out the available voices over here https://tts.icdb.dev/voices",
  "skip" = "Skipped the currently playing message.",
  "stats" = "xD",
  "ban" = "",
  "timeout" = ""
}

export class Commands {
  private static readonly cmdPrefix = "!tts"
  private static readonly responsePrefix = "icdbBot 📣"

  private readonly _bot: Bot


  constructor (bot: Bot) {
    this._bot = bot
  }

  private get bot (): Bot {
    return this._bot
  }

  public async handle (msgObj: IMessageObject): Promise<void> {
    const msgParts = msgObj.message.toLowerCase().split(" ")
    if (msgParts[0] !== Commands.cmdPrefix) {
      return
    }

    // "!tts"    should     trigger "!tts info"
    // "!tts xd" should not trigger "!tts info"
    if (msgParts[1] === undefined || msgParts[1] === "") {
      msgParts[1] = "info"
    }

    let response = ""

    if (msgParts[1] in TtsCmds) {
      const cmdKey = <keyof typeof TtsCmds>msgParts[1]
      switch (cmdKey) {
        case "settings":
          //response = TtsCmds[cmdKey] + msgObj.channelName.substr(1)
          break
        case "skip":
          if (msgObj.userLevel >= UserLevels.MODERATOR) {
            if (await this.bot.apiIcdbDev.SkipTts(msgObj.roomId)) {
              response = "Skipped the currently playing message."
            } else {
              response = "Something went wrong."
            }
            //response = TtsCmds[cmdKey]
          }
          break
        case "timeout":
          if (msgObj.userLevel >= UserLevels.MODERATOR) {
            if (msgParts[2] === undefined || msgParts[2] === "") {
              response = "No user specified"
            } else if (msgParts[3] === undefined || msgParts[3] === "") {
              response = "No duration specified"
            } else {
              const userId = await this.bot.userIdLoginCache.nameToId(msgParts[2])
              const length: number | undefined = parseInt(msgParts[3])
              if (userId === undefined) {
                response = "User not found"
              } else if (length === undefined) {
                response = "No duration specified"
              } else if (length < 30) {
                response = "Minimum allowed duration is 30 seconds"
              } else {
                let untilDate: Date | null = null
                if (cmdKey === "timeout") {
                  parseInt(msgParts[3])
                  untilDate = new Date()
                  untilDate.setSeconds(untilDate.getSeconds() + length)
                }
                if (await this.bot.apiIcdbDev.AddToChannelBlacklist(msgObj.roomId, userId, untilDate)) {
                  response = "Added user to blacklist for " + msgParts[3] + " seconds."
                } else {
                  response = "Something went wrong."
                }
                //response = TtsCmds[cmdKey]
              }
            }
          }
          break
        case "ban":
          if (msgObj.userLevel >= UserLevels.MODERATOR) {
            if (msgParts[2] === undefined || msgParts[2] === "") {
              response = "No user specified"
            } else {
              const userId = await this.bot.userIdLoginCache.nameToId(msgParts[2])
              if (userId === undefined) {
                response = "User not found"
              } else {
                if (await this.bot.apiIcdbDev.AddToChannelBlacklist(msgObj.roomId, userId)) {
                  response = "Added user to blacklist."
                } else {
                  response = "Something went wrong."
                }
                //response = TtsCmds[cmdKey]
              }
            }
          }
          break
        default:
        //response = TtsCmds[cmdKey]
      }
    }

    //TODO: cooldown check (We put it back here so skip will always run just not always answer.

    if (response && !(await msgObj.channelObj.getIrcMuted())) {
      await this.bot.irc.ircConnector.sayWithMsgObj(msgObj, `${Commands.responsePrefix} ${response}`, true)
    }
  }
}
