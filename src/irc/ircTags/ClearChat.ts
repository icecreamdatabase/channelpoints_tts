"use strict"

import {Bot} from "../../Bot"

export class ClearChat {
  private readonly _bot: Bot

  constructor (bot: Bot) {
    this._bot = bot

  }

  public async init () {

  }

  private get bot (): Bot {
    return this._bot
  }
}
