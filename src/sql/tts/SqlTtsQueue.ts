"use strict"
import Sql from "../Sql"
import {IMessageObject} from "../../irc/ircTags/PrivMsg"

export class SqlTtsQueue {
  public static async add (obj: IMessageObject, rewardId: string, isSubOrHigher: boolean, wasTimedOut: boolean): Promise<void> {
    await SqlTtsQueue.addRaw(rewardId, obj.userId, obj.username, isSubOrHigher, obj.message, obj.raw.tags.id, wasTimedOut, obj.timestamp)
  }

  private static async addRaw (rewardId: string, requesterId: number, requesterDisplayName: string, isSubOrHigher: boolean,
                               rawMessage: string, messageId: string, wasTimedOut: boolean, requestTimedstamp: Date): Promise<void> {
    await Sql.query(`
                INSERT INTO RequestQueueIngest (RewardId,
                                                RequesterId,
                                                RequesterDisplayName,
                                                IsSubOrHigher,
                                                RawMessage,
                                                RedemptionId,
                                                WasTimedOut,
                                                RequestTimestamp)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        rewardId,
        requesterId,
        requesterDisplayName,
        isSubOrHigher,
        rawMessage,
        messageId,
        wasTimedOut,
        requestTimedstamp
      ])
  }
}

