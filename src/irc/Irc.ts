"use strict"

import {Bot} from "../Bot"

export class Irc {
  private readonly _bot: Bot

  constructor (bot: Bot) {
    this._bot = bot

  }

  private get bot (): Bot {
    return this._bot
  }
}