"use strict"
import {Bot} from "../../Bot"
import {IMessageObject} from "../ircTags/PrivMsg"
import {SqlRewardVoice} from "../../sql/channel/SqlRewardVoice"
import {Logger} from "../../helper/Logger"
import {UserLevels} from "../../Enums"

export class CustomRewards {
  private readonly _bot: Bot
  // CustomRewardId is the key. This is unique globally so we don't have to worry about channel specific stuff.
  private static readonly _cooldown: Map<string, number> = new Map<string, number>()


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

    Logger.log(`RewardVoice lookup took ${Number(end - start) / 1000000} ms`)

    if (!rewardVoice) {
      // No custom reward with that customRewardId
      return false
    }

    //Sub only
    if (rewardVoice.isSubOnly && messageObj.userLevel < UserLevels.SUB) {
      // TODO Deny subonly

      return true
    }

    // cooldown
    const lastCooldown = CustomRewards._cooldown.get(messageObj.raw.tags["custom-reward-id"]) || 0
    if (Date.now() + lastCooldown < rewardVoice.cooldown) {
      // TODO Deny cooldown

      return true
    }
    CustomRewards._cooldown.set(messageObj.raw.tags["custom-reward-id"], Date.now())

    // TODO: Add to queue

    return true
  }
}
