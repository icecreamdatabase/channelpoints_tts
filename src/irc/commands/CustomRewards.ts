"use strict"
import {Bot} from "../../Bot"
import {IMessageObject} from "../ircTags/PrivMsg"
import {SqlRewardVoice} from "../../sql/tts/SqlRewardVoice"
import {Logger} from "../../helper/Logger"
import {UserLevels} from "../../Enums"
import {SqlTtsLog} from "../../sql/tts/SqlTtsLog"
import {ClearMsg} from "../ircTags/ClearMsg"
import {ClearChat} from "../ircTags/ClearChat"
import {SqlTtsQueue} from "../../sql/tts/SqlTtsQueue"

export class CustomRewards {
  private readonly _bot: Bot
  // CustomRewardId is the key. This is unique globally so we don't have to worry about channel specific stuff.
  private static readonly _lastUsage: Map<string, Date> = new Map<string, Date>()


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
    if (rewardVoice.isSubOnly && msgObj.userLevel < UserLevels.SUB) {
      await SqlTtsLog.add(msgObj, rewardVoice.voicesId, "failedSubmode")
      // TODO Deny subonly answer in chat
      return true
    }

    /* ————— cooldown ————— */
    const lastUsage = CustomRewards._lastUsage.get(msgObj.raw.tags["custom-reward-id"]) || new Date(0) // new Date(0) === UNIX EPOCH --> never used before
    if (msgObj.timestamp.getTime() - lastUsage.getTime() < rewardVoice.cooldown * 1000) {

      await SqlTtsLog.add(msgObj, rewardVoice.voicesId, "failedCooldown")
      // TODO Deny cooldown answer in chat
      return true
    }
    CustomRewards._lastUsage.set(msgObj.raw.tags["custom-reward-id"], msgObj.timestamp)

    /* ————— timeout ————— */
    const timeoutCheckTime: number | undefined = await this.bot.channels.get(msgObj.roomId)?.getTimeoutCheckTime()
    if (timeoutCheckTime === undefined) {
      throw new Error(`timeoutcheckTime for ${msgObj.roomId} (${msgObj.channelName}) is undefined`)
    }

    // wait the timeoutCheckTime
    await new Promise(resolve => setTimeout(resolve, timeoutCheckTime * 1000))

    // check if deleted or timed out.
    if (ClearMsg.wasDeleted(msgObj.raw.tags.id)
      || ClearChat.wasTimedOut(msgObj.channelName, msgObj.username, timeoutCheckTime)) {
      await SqlTtsLog.add(msgObj, rewardVoice.voicesId, "failedTimedOut")
      // TODO Deny timeout answer in chat
      return true
    }

    /* ————— Add to queue ————— */
    await SqlTtsQueue.add(msgObj, rewardVoice.id)
    // TODO: Anything still needed here?

    return true
  }
}
