"use strict"
import Sql from "../Sql"
import {IMessageObject} from "../../irc/ircTags/PrivMsg"

export type ttsLogStatus =
  'sent'
  | 'skippedByNext'
  | 'skippedByMod'
  | 'failedTimedOut'
  | 'failedSubmode'
  | 'failedCooldown'
  | 'error'

export class SqlTtsLog {
  public static async add (obj: IMessageObject, voicesId: number, status: ttsLogStatus): Promise<void> {
    await SqlTtsLog.addRaw(obj.roomId, obj.userId, obj.message, voicesId, obj.userLevel, status, obj.timestamp, obj.raw.tags.id)
  }

  private static async addRaw (roomId: number, userId: number, rawMessage: string, voicesId: number, userLevel: number, status: ttsLogStatus, timestamp: Date, messageId: string): Promise<void> {
    await Sql.query(`
                INSERT INTO ttsLog (roomId,
                                    userId,
                                    rawMessage,
                                    voicesId,
                                    userLevel,
                                    status,
                                    TIMESTAMP,
                                    messageId)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
      [roomId,
        userId,
        rawMessage,
        voicesId,
        userLevel,
        status,
        timestamp,
        messageId])
  }
}

