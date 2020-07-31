"use strict"

import {Bot} from "../Bot"
import {ClearChat} from "./ircTags/ClearChat"
import {ClearMsg} from "./ircTags/ClearMsg"
import {PrivMsg} from "./ircTags/PrivMsg"
import {UserNotice} from "./ircTags/UserNotice"
import {UserState} from "./ircTags/UserState"
import {ChatLimit} from "../Enums"
import {IrcConnector} from "./IrcConnector"

export class Irc {
  private readonly _bot: Bot
  private readonly _ircConnector: IrcConnector = new IrcConnector(this.bot)
  private readonly _clearChat: ClearChat = new ClearChat(this.bot)
  private readonly _clearMsg: ClearMsg = new ClearMsg(this.bot)
  private readonly _privMsg: PrivMsg = new PrivMsg(this.bot)
  private readonly _userNotice: UserNotice = new UserNotice(this.bot)
  private readonly _userState: UserState = new UserState(this.bot)

  private _rateLimitUser: ChatLimit = ChatLimit.NORMAL
  private _rateLimitModerator: ChatLimit = ChatLimit.NORMAL_MOD

  constructor (bot: Bot) {
    this._bot = bot

  }

  public async init (): Promise<void> {
    await this.updateBotRatelimits()
    await this.ircConnector.init()
  }

  private get bot (): Bot {
    return this._bot
  }

  get ircConnector (): IrcConnector {
    return this._ircConnector
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

  public get rateLimitUser (): ChatLimit {
    return this._rateLimitUser
  }

  public get rateLimitModerator (): ChatLimit {
    return this._rateLimitModerator
  }

  async updateBotRatelimits (): Promise<void> {
    const userInfo = await this.bot.apiKraken.userInfo(this.bot.userId)

    if (userInfo["is_verified_bot"]) {
      this._rateLimitUser = ChatLimit.VERIFIED
      this._rateLimitModerator = ChatLimit.VERIFIED_MOD
    } else if (userInfo["is_known_bot"]) {
      this._rateLimitUser = ChatLimit.KNOWN
      this._rateLimitModerator = ChatLimit.KNOWN_MOD
    } else {
      this._rateLimitUser = ChatLimit.NORMAL
      this._rateLimitModerator = ChatLimit.NORMAL_MOD
    }
  }
}
