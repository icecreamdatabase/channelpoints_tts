"use strict"
import Axios, {Method} from "axios"

import {Bot} from "../Bot"
import {Logger} from "../helper/Logger"


//TODO: use custom axois instances https://www.npmjs.com/package/axios

export class Helix {
  private readonly _bot: Bot

  constructor (bot: Bot) {
    this._bot = bot
  }

  private get bot () {
    return this._bot
  }

  private async request<T> (pathAppend: string, method: Method = 'GET'): Promise<T> {
    try {
      const result = await Axios({
        url: `https://api.twitch.tv/helix/${pathAppend}`,
        method: method,
        headers: {
          'Accept': 'application/vnd.twitchtv.v5+json',
          'Client-ID': this.bot.authentication.clientId,
          'Authorization': this.bot.authentication.accessToken,
        }
      })
      return result.data
    } catch (e) {
      Logger.warn(e)
      //throw new Error(e)
      return e.response.data
    }
  }

}

