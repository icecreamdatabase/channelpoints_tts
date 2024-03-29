"use strict"
import Axios from "axios"
import {Bot} from "../Bot"

//TODO: use custom axois instances https://www.npmjs.com/package/axios

export class IcdbDev {
  private static readonly SUPINIC_API_PING_INTERVAL = 1800000 // 30 minutes
  private readonly _bot: Bot

  public constructor (bot: Bot) {
    this._bot = bot

  }

  private get bot (): Bot {
    return this._bot
  }


  public async SkipTts (roomId: number): Promise<boolean> {
    try {
      const result = await Axios({
        url: `https://ttsapi.icdb.dev/redemption`,
        method: "DELETE",
        headers: {
          'Authorization': `OAuth ${this.bot.authentication.accessToken}`
        },
        params: {
          roomId: roomId
        }
      })
      return result.status === 204
    } catch (e) {
      return false
    }
  }

  public async AddToChannelBlacklist (roomId: number, userId: number | string, untilDate: Date | null = null): Promise<boolean> {
    try {
      const result = await Axios({
        url: `https://ttsapi.icdb.dev/channelblacklist`,
        method: "POST",
        headers: {
          'Authorization': `OAuth ${this.bot.authentication.accessToken}`
        },
        params: {
          roomId: roomId
        },
        data: {
          userId: userId,
          untilDate: untilDate
        }
      })
      return result.status === 201
    } catch (e) {
      return false
    }
  }
}

