"use strict"

import {Bot} from "../../Bot"
import {IClearMsg} from "./IIrcTags"

export class ClearMsg {
  private readonly _bot: Bot
  private static deletedMsgIds: string[] = []
  private static CLEAR_OLD_ENTIRES_INTERVAL = 300000 // 5 minutes
  private static KEEP_OLD_ENTRY_AMOUNT = 200

  constructor (bot: Bot) {
    this._bot = bot

  }

  public async init (): Promise<void> {
    this.bot.irc.ircConnector.on('CLEARMSG', this.onClearMsg.bind(this))
    setInterval(ClearMsg.clearOldEntries, ClearMsg.CLEAR_OLD_ENTIRES_INTERVAL)
  }

  private get bot (): Bot {
    return this._bot
  }

  /**
   * Method from bot.TwitchIRCconnection event emitter 'CLEARMSG'.
   * @param clearMsgObj raw object from TwitchIRCconnection registerEvents
   * @returns {Promise<void>}
   */
  onClearMsg (clearMsgObj: IClearMsg): void {
    ClearMsg.deletedMsgIds.push(clearMsgObj.tags["target-msg-id"])
  }

  /**
   * Check if a user was timed out before in a channel
   */
  static wasDeleted (msgId: string): boolean {
    return ClearMsg.deletedMsgIds.includes(msgId)
  }

  /**
   * Clear the deletedMsgIds array but keep the last KEEP_OLD_ENTRY_AMOUNT of entries
   */
  static clearOldEntries (): void {
    ClearMsg.deletedMsgIds = ClearMsg.deletedMsgIds.slice(ClearMsg.deletedMsgIds.length - ClearMsg.KEEP_OLD_ENTRY_AMOUNT)
  }
}
