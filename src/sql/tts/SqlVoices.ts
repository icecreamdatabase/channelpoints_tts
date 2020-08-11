"use strict"
import Sql from "../Sql"
import {RowDataPacket, FieldPacket} from "mysql2"

//import * as voicesJson from "../../se-voices.json"

export interface ISqlVoices {
  id: number,
  voicesId: string,
  voiceName: string,
  language: string
}

export class SqlVoices {
  private static _voiceDbId: Map<number, ISqlVoices> = new Map<number, ISqlVoices>()
  private static _voiceVoicesId: Map<string, ISqlVoices> = new Map<string, ISqlVoices>()
  private static _voiceVoicesName: Map<string, ISqlVoices> = new Map<string, ISqlVoices>()

  private static async getVoices (): Promise<ISqlVoices[]> {
    const [rows]: [RowDataPacket[], FieldPacket[]] = await Sql.query<RowDataPacket[]>(`
        SELECT id, voiceId, voiceName, language
        FROM voices;`)

    return <ISqlVoices[]>rows
  }

  /**
   * Function caches after first run because the values should never change.
   */
  public static async getVoiceDbId (): Promise<Map<number, ISqlVoices>> {
    if (this._voiceDbId.size === 0) {
      const voices: Map<number, ISqlVoices> = new Map<number, ISqlVoices>()
      for (const sqlVoice of await this.getVoices()) {
        voices.set(sqlVoice.id, sqlVoice)
      }
      this._voiceDbId = voices
    }
    return this._voiceDbId
  }

  /**
   * Function caches after first run because the values should never change.
   */
  public static async getVoiceVoicesId (): Promise<Map<string, ISqlVoices>> {
    if (this._voiceVoicesId.size === 0) {
      const voices: Map<string, ISqlVoices> = new Map<string, ISqlVoices>()
      for (const sqlVoice of await this.getVoices()) {
        voices.set(sqlVoice.voicesId, sqlVoice)
      }
      this._voiceVoicesId = voices
    }
    return this._voiceVoicesId
  }

  /**
   * Function caches after first run because the values should never change.
   */
  public static async getVoiceVoicesName (): Promise<Map<string, ISqlVoices>> {
    if (this._voiceVoicesName.size === 0) {
      const voices: Map<string, ISqlVoices> = new Map<string, ISqlVoices>()
      for (const sqlVoice of await this.getVoices()) {
        voices.set(sqlVoice.voiceName, sqlVoice)
      }
      this._voiceVoicesName = voices
    }
    return this._voiceVoicesName
  }

  //public static async generateFromJson (): Promise<void> {
  //  for (const language of Object.values(voicesJson)) {
  //    if (language.voices) {
  //      for (const voice of language.voices) {
  //        if (voice) {
  //          await Sql.query(` INSERT IGNORE INTO voices (voiceId, voiceName, language)
  //                            VALUES (?, ?, ?);`, [voice.id, voice.name, language.lang])
  //        }
  //      }
  //    }
  //  }
  //  Logger.info("generateFromJson done")
  //}
}

