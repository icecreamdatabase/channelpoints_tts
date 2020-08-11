"use strict"
import {Bot} from "../../Bot"
import {IMessageObject} from "../ircTags/PrivMsg"
import {SqlRewardVoice} from "../../sql/channel/SqlRewardVoice"
import {Logger} from "../../helper/Logger"
import {ISqlVoices, SqlVoices} from "../../sql/channel/SqlVoices"
import * as util from "util"

export class CustomRewards {
  private readonly _bot: Bot


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
    if (!messageObj.raw.tags["custom-reward-id"]) {
      return false
    }

    const start = process.hrtime.bigint()

    const rewardVoice = await SqlRewardVoice.get(messageObj.roomId, messageObj.raw.tags["custom-reward-id"])

    const end = process.hrtime.bigint()

    Logger.log(`${Number(end - start) / 1000000 } ms`)

    if (!rewardVoice) {
      return false
    }

    // TODO

    return true
  }
}
