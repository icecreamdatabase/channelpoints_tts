"use strict"
import {Bot} from "../../Bot"
import {IMessageObject} from "../ircTags/PrivMsg"

export class Commands {
  private readonly _bot: Bot


  constructor (bot: Bot) {
    this._bot = bot
  }

  /**
   * @return {Bot}
   */
  private get bot () {
    return this._bot
  }

  public async handle (messageObj: IMessageObject): Promise<boolean> {


    return false
  }
}
