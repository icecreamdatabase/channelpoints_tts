"use strict"

import {Bot} from "../../Bot"

export class UserNotice {
  private readonly _bot: Bot

  constructor (bot: Bot) {
    this._bot = bot

  }

  public async init (): Promise<void> {

  }

  private get bot (): Bot {
    return this._bot
  }
}
