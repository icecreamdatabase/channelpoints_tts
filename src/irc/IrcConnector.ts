"use strict"
import {Bot} from "../Bot"
import {Logger} from "../helper/Logger"
import {IrcWsCmds, UserLevels} from "../Enums"
import {
  IWsDataAuth,
  IWsDataData,
  IWsDataJoinPartSet,
  IWsDataMain,
  IWsDataReceive,
  IWsDataRequestIrcStates
} from "./IIrcConnector"

import WebSocket from "ws"
import EventEmitter from "eventemitter3"
import Assert from "assert"

import config from "../config.json"

const AUTH_UPDATE_INTERVAL_CHECK = 15000 // 15 seconds

export class IrcConnector extends EventEmitter {
  private readonly _bot: Bot;
  private _wsSendQueue: IWsDataMain[] = []
  private _lastSentAuthObj?: IWsDataAuth
  private _ws?: WebSocket

  constructor (bot: Bot) {
    super()
    this._bot = bot

    this.on('queue', this.checkQueue.bind(this))

    setInterval(this.sendAuthData.bind(this), AUTH_UPDATE_INTERVAL_CHECK)

    //this.connect()
  }

  public async init (): Promise<void> {
    this.connect()
  }

  private get bot (): Bot {
    return this._bot
  }

  get version (): string {
    return "1.0.0"
  }

  async joinChannel (channels: string | string[]): Promise<void> {
    if (!Array.isArray(channels)) {
      channels = [channels]
    }
    const data: IWsDataJoinPartSet = {botUserId: this.bot.userId, channelNames: channels}
    await this.send(IrcWsCmds.JOIN, data)
  }

  async leaveChannel (channels: string | string[]): Promise<void> {
    if (!Array.isArray(channels)) {
      channels = [channels]
    }
    const data: IWsDataJoinPartSet = {botUserId: this.bot.userId, channelNames: channels}
    await this.send(IrcWsCmds.PART, data)
  }

  async rejoinChannel (channels: string | string[]): Promise<void> {
    await this.leaveChannel(channels)
    await this.joinChannel(channels)
  }

  async setChannel (channels: string | string[]): Promise<void> {
    if (!Array.isArray(channels)) {
      channels = [channels]
    }
    const data: IWsDataJoinPartSet = {botUserId: this.bot.userId, channelNames: channels}
    await this.send(IrcWsCmds.SET_CHANNELS, data)
  }

  sendWhisper (targetUser: string, message: string): void {
    this.sayWithBoth(this.bot.userId, this.bot.userName, `.w ${targetUser} ${message}`)
  }

  /**
   * Send a message with the msgObj
   * @param msgObj
   * @param message
   * @param {boolean} [useSameSendConnectionAsPrevious] undefined = automatic detection based on message splitting.
   */
  sayWithMsgObj (msgObj: any/* TODO */, message: string, useSameSendConnectionAsPrevious?: boolean): void {
    this.sayWithBoth(msgObj.roomId, msgObj.channel, message, useSameSendConnectionAsPrevious)
  }

  /**
   * Send a message with both the channelId and the channelName.
   * channelId and channelName have to match else there might be unpredictable problems.
   * @param {number} channelId
   * @param {string} channelName
   * @param {string} message
   * @param {boolean} [useSameSendConnectionAsPrevious] undefined = automatic detection based on message splitting.
   */
  sayWithBoth (channelId: number, channelName: string, message: string, useSameSendConnectionAsPrevious?: boolean): void {
    const data: IWsDataMain = {
      cmd: IrcWsCmds.SEND,
      data: {
        botUserId: this.bot.userId,
        channelName,
        message,
        botStatus: this.bot.channels.getChannel(channelId)?.botStatus || UserLevels.DEFAULT,
        useSameSendConnectionAsPrevious,
        maxMessageLength: this.bot.channels.getChannel(channelId)?.maxMessageLength
      },
      version: this.version,
      applicationId: config.wsConfig.TwitchIrcConnectorOwnApplicationId
    }
    this._wsSendQueue.push(data)
    Logger.debug(`${this.bot.userId} (${this.bot.userName}) --> ${channelName} :${message}`)
    this.emit('queue')
  }

  async checkQueue (): Promise<void> {
    if (this._wsSendQueue.length > 0) {
      if (this._ws && this._ws.readyState === this._ws.OPEN) {
        const queueElement = this._wsSendQueue.shift()
        if (queueElement) {
          try {
            await this.sendRaw(queueElement.cmd, queueElement.data)
            this.emit('queue')
            return
          } catch (e) {
            this._wsSendQueue.unshift(queueElement)
            Logger.warn(`Sending MESSAGE to TwitchIrcConnector failed even though the socket connection is open:\n${e}`)
          }
        } else {
          Logger.warn(`Couldn't shift from _wsSendQueue even though length > 0`)
        }
      }
      await new Promise(resolve => setTimeout(resolve, 500)) // sleep 500 ms
      this.emit('queue')
    }
  }

  async send (cmd: string, data: IWsDataData): Promise<void> {
    this._wsSendQueue.push({cmd, data, version: undefined, applicationId: undefined})
    this.emit('queue')
  }

  async sendRaw (cmd: string, data: IWsDataData, version: string = this.version, applicationId: number | string = config.wsConfig.TwitchIrcConnectorOwnApplicationId): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        /* ? 🤔 */
        this._ws?.send(JSON.stringify({cmd, data, version, applicationId}), {}, <never>resolve) // TODO: will this never cast break?
      } catch (e) {
        reject(e)
      }
    })
  }

  connect (): void {
    this._ws = new WebSocket(`ws://${config.wsConfig.TwitchIrcConnectorUrl}:${config.wsConfig.TwitchIrcConnectorPort}`)
    // Connection opened
    this._ws.addEventListener('open', () => {
      Logger.log("Connected")
      // make sure we resend auth every time we connet to the server!
      this._lastSentAuthObj = undefined
      this.sendAuthData().then(() =>
        //Resend all channels after a reconnect. The chance of the TwitchIrcConnector having restarted is very high.
        this.bot.channels.updateFromDb().then(() =>
          this.requestIrcStates().then(() =>
            Logger.info(`### WS (re)connect sending channels done: ${this.bot.userId} (${this.bot.userName})`)
          )
        )
      )
    })

    // Listen for messages
    this._ws.addEventListener('message', async event => {
      const obj: IWsDataMain = JSON.parse(event.data)
      //console.log(obj)
      if (obj.cmd) {
        if (obj.cmd === IrcWsCmds.RECEIVE) {
          for (const dataElement of <IWsDataReceive>obj.data) {
            this.emit(dataElement.command.toString().toUpperCase(), dataElement)
          }
        }
      }
    })

    this._ws.addEventListener('close', () => {
      //Logger.debug(`IrcConnector close`)
      this._ws?.terminate()
      this._ws?.removeAllListeners()
      this._ws = undefined
      this.connect()
    })
    this._ws.addEventListener('error', () => {
      //Logger.debug(`IrcConnector error`)
      //this._ws.terminate()
      //this._ws.removeAllListeners()
      //this._ws = undefined
      //this.connect()
    })
  }

  async requestIrcStates (): Promise<void> {
    if (!this._ws || this._ws.readyState !== this._ws.OPEN) {
      return
    }
    try {
      Logger.info(`Requesting irc states of ${this.bot.userId} (${this.bot.userName}) to TwitchIrcConnector.`)
      const data: IWsDataRequestIrcStates = {botUserId: this.bot.userId}
      await this.send(IrcWsCmds.GET_IRC_STATES, data)
    } catch (e) {
      Logger.warn(`Requesting irc states from TwitchIrcConnector failed even though the socket connection is open:\n${e}`)
    }
  }

  async sendAuthData (): Promise<void> {
    if (!this._ws || this._ws.readyState !== this._ws.OPEN) {
      return
    }

    const data: IWsDataAuth = {
      userId: this.bot.userId,
      userName: this.bot.userName,
      accessToken: this.bot.authentication.accessToken,
      rateLimitUser: this.bot.irc.rateLimitUser,
      rateLimitModerator: this.bot.irc.rateLimitModerator
    }
    try {
      Assert.deepStrictEqual(data, this._lastSentAuthObj)
    } catch (e) {
      //Throws exception if they are NOT equal --> send new data
      this._lastSentAuthObj = data
      try {
        Logger.info(`Sending auth data of ${this.bot.userId} (${this.bot.userName}) to TwitchIrcConnector.`)
        await this.send(IrcWsCmds.AUTH, data)
      } catch (e) {
        Logger.warn(`Sending AUTH to TwitchIrcConnector failed even though the socket connection is open:\n${e}`)
      }
    }
  }
}

