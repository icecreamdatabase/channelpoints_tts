"use strict"
import Sql from "../Sql"
import {IMessageObject} from "../../irc/ircTags/PrivMsg"

export class SqlTtsQueue {
  public static async add (obj: IMessageObject, rewardVoiceId: number): Promise<void> {
    await SqlTtsQueue.addRaw(obj.roomId, obj.userId, obj.username, obj.raw.tags.color, obj.message, obj.userLevel, obj.timestamp, obj.raw.tags.id, rewardVoiceId)
  }

  private static async addRaw (roomId: number, userId: number, userName: string, color: string | true, rawMessage: string, userLevel: number, msgTimestamp: Date, messageId: string, rewardVoiceId: number): Promise<void> {
    await Sql.query(`
                INSERT INTO ttsQueue (roomId,
                                      userId,
                                      userName,
                                      color,
                                      userLevel,
                                      rawMessage,
                                      msgTimestamp,
                                      messageId,
                                      rewardVoiceId)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [roomId,
        userId,
        userName,
        color === true ? null : color, // if the user has not set a custom colour --> set null in db
        userLevel,
        rawMessage,
        msgTimestamp,
        messageId,
        rewardVoiceId])
  }
}

