"use strict"
import Sql from "./../Sql"
import {RowDataPacket, FieldPacket} from "mysql2"

export interface ISqlVoices {
  id: number,
  voicesId: string,
  voiceName: string,
  language: string
}

export class SqlVoices {
  private static async getVoices (): Promise<ISqlVoices[]> {
    const [rows]: [RowDataPacket[], FieldPacket[]] = await Sql.query<RowDataPacket[]>(`
        SELECT id, voiceId, voiceName, language
        FROM voices;`)

    return <ISqlVoices[]>rows
  }

  public static async getVoiceDbId (): Promise<Record<number, ISqlVoices>> {
    const voices: Record<number, ISqlVoices> = {}

    for (const sqlVoice of await this.getVoices()) {
      voices[sqlVoice.id] = sqlVoice
    }
    return voices
  }

  public static async getVoiceVoicesId (): Promise<Record<string, ISqlVoices>> {
    const voices: Record<string, ISqlVoices> = {}

    for (const sqlVoice of await this.getVoices()) {
      voices[sqlVoice.voicesId] = sqlVoice
    }
    return voices
  }

  public static async getVoiceVoicesName (): Promise<Record<string, ISqlVoices>> {
    const voices: Record<string, ISqlVoices> = {}

    for (const sqlVoice of await this.getVoices()) {
      voices[sqlVoice.voiceName] = sqlVoice
    }
    return voices
  }
}

