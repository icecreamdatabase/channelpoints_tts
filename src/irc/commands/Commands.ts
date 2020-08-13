"use strict"
import {Bot} from "../../Bot"
import {IMessageObject} from "../ircTags/PrivMsg"

// noinspection JSUnusedGlobalSymbols
enum TtsCmds {
  "info" = "This is a channelpoint based TTS system made by icdb. https://tts.icdb.dev",
  "help" = "This is the help command",
  "settings" = "The settings have moved over here PogChamp 👉 https://tts.icdb.dev/dashboard?c=",
  "voices" = "You can check out the available voices over here https://tts.icdb.dev/voices",
  "skip" = "Skipped the currently playing message.",
  "stats" = "xD"
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
          response = TtsCmds[cmdKey] + msgObj.channelName.substr(1)
          break
        case "skip":
          //TODO: skip (api.icdb.dev call somehow)
          response = TtsCmds[cmdKey]
          break
        default:
          response = TtsCmds[cmdKey]
      }
    }

    //TODO: cooldown check (We put it back here so skip will always run just not always answer.

    if (response && !(await msgObj.channelObj.getIrcMuted())) {
      await this.bot.irc.ircConnector.sayWithMsgObj(msgObj, `${Commands.responsePrefix} ${response}`, true)
    }
  }
}
