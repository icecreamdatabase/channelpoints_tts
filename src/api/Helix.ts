"use strict"
import Axios, {Method} from "axios"

import {Bot} from "../Bot";


//TODO: use custom axois instances https://www.npmjs.com/package/axios

export class Helix {
  private readonly _bot: any

  constructor (bot: Bot) {
    this._bot = bot
  }

  private get bot () {
    return this._bot
  }

  private async request (pathAppend: string, method: Method = 'GET') : Promise<any>{
    try {
      let result = await Axios({
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
      //ignore
    }
  }

}

