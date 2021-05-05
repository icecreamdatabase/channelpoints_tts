"use strict"
import {Bot} from "../../Bot"
import {IMessageObject} from "../ircTags/PrivMsg"
import {SqlRewardVoice} from "../../sql/tts/SqlRewardVoice"
import {Logger} from "../../helper/Logger"
import {UserLevels} from "../../Enums"
import {ClearMsg} from "../ircTags/ClearMsg"
import {ClearChat} from "../ircTags/ClearChat"
import {SqlTtsQueue} from "../../sql/tts/SqlTtsQueue"

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

  public async handle (msgObj: IMessageObject): Promise<boolean> {
    if (!msgObj.raw.tags["custom-reward-id"]) {
      return false
    }

    const start = process.hrtime.bigint()

    const rewardVoice = await SqlRewardVoice.get(msgObj.roomId, msgObj.raw.tags["custom-reward-id"])

    const end = process.hrtime.bigint()

    Logger.log(`RewardVoice lookup took ${Number(end - start) / 1000000} ms`)

    if (!rewardVoice) {
      // No custom reward with that customRewardId
      return false
    }

    /* ————— Sub only ————— */
    const isSubOrHigher = msgObj.userLevel >= UserLevels.SUB

    /* ————— timeout ————— */
    const timeoutCheckTime = await msgObj.channelObj.getTimeoutCheckTime()

    // wait the timeoutCheckTime
    await new Promise(resolve => setTimeout(resolve, timeoutCheckTime * 1000))

    // check if deleted or timed out.
    const wasTimedOut = ClearMsg.wasDeleted(msgObj.raw.tags.id) || ClearChat.wasTimedOut(msgObj.channelName, msgObj.username, timeoutCheckTime)

    /* ————— Add to queue ————— */
    await SqlTtsQueue.add(msgObj, rewardVoice.RewardId, isSubOrHigher, wasTimedOut)

    return true
  }
}
