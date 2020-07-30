"use strict"

import {Bot} from "../Bot"
import {ClearChat} from "./ircTags/ClearChat";
import {ClearMsg} from "./ircTags/ClearMsg";
import {PrivMsg} from "./ircTags/PrivMsg";
import {UserNotice} from "./ircTags/UserNotice";
import {UserState} from "./ircTags/UserState";

export class Irc {
  private readonly _bot: Bot
  private readonly _clearChat: ClearChat = new ClearChat(this.bot)
  private readonly _clearMsg: ClearMsg = new ClearMsg(this.bot)
  private readonly _privMsg: PrivMsg = new PrivMsg(this.bot)
  private readonly _userNotice: UserNotice = new UserNotice(this.bot)
  private readonly _userState: UserState = new UserState(this.bot)

  constructor (bot: Bot) {
    this._bot = bot

  }

  public async init () {

  }

  private get bot (): Bot {
    return this._bot
  }

  private get clearChat (): ClearChat {
    return this._clearChat
  }

  private get clearMsg (): ClearMsg {
    return this._clearMsg
  }

  private get privMsg (): PrivMsg {
    return this._privMsg
  }

  private get userNotice (): UserNotice {
    return this._userNotice
  }

  private get userstate (): UserState {
    return this._userState
  }
}
