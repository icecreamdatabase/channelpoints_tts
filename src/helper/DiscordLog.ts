"use strict"
import {IncomingMessage} from "http"
import * as https from "https"
import {Logger} from "./Logger"
import {EventEmitter} from "eventemitter3"
import * as config from "./../config.json"

const DISCORD_REQUEST_TEMPLATE = {
  host: "discordapp.com",
  path: "/api/webhooks/",
  method: 'POST',
  headers: {
    "Content-Type": "application/json"
  },
}

type IWebhookNamesConfig = "bot-log" | "tts-status-log" | "tts-message-log" | "whisper-log"
type IWebhookNames = IWebhookNamesConfig | "custom"

interface IMsgQueueObj {
  postContent: IMsgQueuePostContent,
  webhookName: IWebhookNames | IWebhookNamesConfig,
  id?: string,
  token?: string
}

interface IMsgQueuePostContent {
  wait: boolean
  embeds: IMsgQueueEmbed[]
}

interface IMsgQueueEmbed {
  color: string | number,
  description: string,
  title: string,
  timestamp: string
  footer?: IMsgQueueEmbedFooter
}

interface IMsgQueueEmbedFooter {
  text: string,
  icon_url: string
}

// noinspection JSUnusedGlobalSymbols
export class DiscordLog {
  /**
   * Logs a message in bot-log discord channel.
   * Type: Error
   * Colour: Red
   */
  public static error (message: unknown): void {
    MESSAGE_QUEUE.push(DiscordLog.getMessageQueueObj("bot-log", "Error", message, "16009031"))
    LOG_QUEUE_EMITTER.emit("event")
  }

  /**
   * Logs a message in bot-log discord channel.
   * Type: Warn
   * Colour: Red
   */
  public static warn (message: unknown): void {
    MESSAGE_QUEUE.push(DiscordLog.getMessageQueueObj("bot-log", "Warn", message, "16009031"))
    LOG_QUEUE_EMITTER.emit("event")
  }

  /**
   * Logs a message in bot-log discord channel.
   * Type: Info
   * Colour: Yellow
   */
  public static info (message: unknown): void {
    MESSAGE_QUEUE.push(DiscordLog.getMessageQueueObj("bot-log", "Info", message, "15653937"))
    LOG_QUEUE_EMITTER.emit("event")
  }

  /**
   * Logs a message in bot-log discord channel.
   * Type: Debug
   * Colour: Green
   */
  public static debug (message: unknown): void {
    MESSAGE_QUEUE.push(DiscordLog.getMessageQueueObj("bot-log", "Debug", message, "8379242"))
    LOG_QUEUE_EMITTER.emit("event")
  }

  /**
   * Logs a message in bot-log discord channel.
   * Type: Trace
   * Colour: Green
   */
  public static trace (message: unknown): void {
    MESSAGE_QUEUE.push(DiscordLog.getMessageQueueObj("bot-log", "Trace", message, "8379242"))
    LOG_QUEUE_EMITTER.emit("event")
  }

  /**
   * Log a message in a twitch message style.
   * By webhookName
   */
  public static twitchMessageCustom (webhookName: IWebhookNamesConfig, title: string, description: string, timestamp: string, colorHex: string, footerText: string, footerIconUrl: string): void {
    if (Object.prototype.hasOwnProperty.call(config, "discord") && Object.prototype.hasOwnProperty.call(config.discord, webhookName)) {
      this.twitchMessageManual(config.discord[webhookName].id, config.discord[webhookName].token, title, description, timestamp, colorHex, footerText, footerIconUrl)
    }
  }

  /**
   * Log a message in a twitch message style.
   * By id and token
   */
  public static twitchMessageManual (id: string, token: string, title: string, description: string, timestamp: string, colorHex: string, footerText: string, footerIconUrl: string): void {
    const msgQueueObj: IMsgQueueObj = {
      webhookName: "custom",
      id: id,
      token: token,
      postContent: {
        wait: true,
        embeds: [{
          title: title,
          description: description,
          timestamp: timestamp,
          color: DiscordLog.getDecimalFromHexString(colorHex),
          footer: {
            text: footerText,
            icon_url: footerIconUrl
          }
        }]
      }
    }
    MESSAGE_QUEUE.push(msgQueueObj)
    LOG_QUEUE_EMITTER.emit(("event"))
  }

  /**
   * Send a Discord webhook object manually.
   */
  private static manual (messageQueueObj: IMsgQueueObj): void {
    MESSAGE_QUEUE.push(messageQueueObj)
    LOG_QUEUE_EMITTER.emit(("event"))
  }

  /**
   * Send a basic message to a Discord webhook.
   */
  public static custom (webhookName: IWebhookNamesConfig, title: string, message: string, decimalColour: string | number): void {
    MESSAGE_QUEUE.push(DiscordLog.getMessageQueueObj(webhookName, title, message, decimalColour))
    LOG_QUEUE_EMITTER.emit("event")
  }

  /**
   * Convert Hex colour string to decimal used by Discord webhooks
   */
  static getDecimalFromHexString (hex: string): number {
    hex = hex.toString().replace("#", "")
    return parseInt(hex, 16)
  }


  /**
   * Create basic Discord webhook object.
   * Has not converted webhookname to id + token yet.
   */
  private static getMessageQueueObj (webhookName: IWebhookNames, title: string, message: unknown, decimalColour: string | number): IMsgQueueObj {
    return {
      "webhookName": webhookName,
      "postContent": {
        "wait": true,
        "embeds": [{
          "title": title,
          "description": String(message),
          "timestamp": new Date().toISOString(),
          "color": decimalColour
        }]
      }
    }
  }

  /**
   * Checks the queue, handles the current object and send the 'event' event again.
   * Use like this: LOG_QUEUE_EMITTER.on('event', queueRunner)
   */
  public static queueRunner (): void {
    if (MESSAGE_QUEUE.length > 0 && !QUEUE_BEING_CHECKED) {
      QUEUE_BEING_CHECKED = true
      DiscordLog.sendToWebhook(MESSAGE_QUEUE.shift()).then(() => {
        QUEUE_BEING_CHECKED = false
        LOG_QUEUE_EMITTER.emit("event")
      }, () => {
        QUEUE_BEING_CHECKED = false
        LOG_QUEUE_EMITTER.emit("event")
      })
    }
  }

  /**
   * Send a messageQueueObj to the Discord servers.
   * Converts webhookName to id + token
   */
  private static async sendToWebhook (messageQueueObj: IMsgQueueObj | undefined): Promise<IncomingMessage | void> {
    return new Promise((resolve, reject) => {
      //Logger.info(JSON.stringify(messageQueueObj, null, 2))
      if (!messageQueueObj) {
        reject()
        return
      }
      if (messageQueueObj.webhookName === "custom"
        || Object.prototype.hasOwnProperty.call(config, "discord") && Object.prototype.hasOwnProperty.call(config.discord, messageQueueObj.webhookName)) {
        const request = Object.assign({}, DISCORD_REQUEST_TEMPLATE)
        if (messageQueueObj.webhookName === "custom") {
          request.path += messageQueueObj.id + "/" + messageQueueObj.token
        } else {
          request.path += `${config.discord[messageQueueObj.webhookName].id}/${config.discord[messageQueueObj.webhookName].token}`
        }
        const req = https.request(request, (res) => {
          resolve(res)
        })
        req.on('error', (err) => {
          Logger.error(err)
          reject(err)
        })
        req.write(JSON.stringify(messageQueueObj.postContent))
        req.end()
      } else {
        Logger.warn("no options.discord.logwebhook")
        reject()
      }
    })
  }
}

//TODO move this into static variables / functions. No clue how to do the .on('event', ...)
const MESSAGE_QUEUE: IMsgQueueObj[] = []
const LOG_QUEUE_EMITTER = new EventEmitter()
LOG_QUEUE_EMITTER.on('event', DiscordLog.queueRunner)

let QUEUE_BEING_CHECKED = false
