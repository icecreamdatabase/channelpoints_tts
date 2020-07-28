"use strict"
import {IncomingMessage} from "http";
import * as https from "https"
import {Logger} from "./Logger"
import {EventEmitter} from "eventemitter3";
import * as config from "./../config.json"

const DISCORD_REQUEST_TEMPLATE = {
  host: "discordapp.com",
  path: "/api/webhooks/",
  method: 'POST',
  headers: {
    "Content-Type": "application/json"
  },
}

interface IMsgQueueObj {
  postContent: IMsgQueuePostContent,
  webhookName: string,
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

export class DiscordLog {
  /**
   * Logs a message in bot-log discord channel.
   * Type: Error
   * Colour: Red
   * @param message Message to log
   */
  public static error (message: unknown): void {
    MESSAGE_QUEUE.push(DiscordLog.getMessageQueueObj("bot-log", "Error", message, "16009031"))
    LOG_QUEUE_EMITTER.emit("event")
  }

  /**
   * Logs a message in bot-log discord channel.
   * Type: Warn
   * Colour: Red
   * @param message Message to log
   */
  public static warn (message: unknown): void {
    MESSAGE_QUEUE.push(DiscordLog.getMessageQueueObj("bot-log", "Warn", message, "16009031"))
    LOG_QUEUE_EMITTER.emit("event")
  }

  /**
   * Logs a message in bot-log discord channel.
   * Type: Info
   * Colour: Yellow
   * @param message Message to log
   */
  public static info (message: unknown): void {
    MESSAGE_QUEUE.push(DiscordLog.getMessageQueueObj("bot-log", "Info", message, "15653937"))
    LOG_QUEUE_EMITTER.emit("event")
  }

  /**
   * Logs a message in bot-log discord channel.
   * Type: Debug
   * Colour: Green
   * @param message Message to log
   */
  public static debug (message: unknown): void {
    MESSAGE_QUEUE.push(DiscordLog.getMessageQueueObj("bot-log", "Debug", message, "8379242"))
    LOG_QUEUE_EMITTER.emit("event")
  }

  /**
   * Logs a message in bot-log discord channel.
   * Type: Trace
   * Colour: Green
   * @param message Message to log
   */
  public static trace (message: unknown): void {
    MESSAGE_QUEUE.push(DiscordLog.getMessageQueueObj("bot-log", "Trace", message, "8379242"))
    LOG_QUEUE_EMITTER.emit("event")
  }

  /**
   * Log a message in a twitch message style.
   * By webhookName
   */
  public static twitchMessageCustom (webhookName: string, title: string, description: string, timestamp: string, colorHex: string, footerText: string, footerIconUrl: string): void {
    if (Object.prototype.hasOwnProperty.call(config, "discord") && Object.prototype.hasOwnProperty.call(config.discord, webhookName)) {
      // @ts-ignore TODO: don't ignore this. But idk enough about TypeScript to not ignore it currently.
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
   * @param messageQueueObj Discord webhook object
   */
  private static manual (messageQueueObj: IMsgQueueObj): void {
    MESSAGE_QUEUE.push(messageQueueObj)
    LOG_QUEUE_EMITTER.emit(("event"))
  }

  /**
   * Send a basic message to a Discord webhook.
   * @param webhookName
   * @param title
   * @param message
   * @param decimalColour
   */
  public static custom (webhookName: string, title: string, message: string, decimalColour: string | number): void {
    MESSAGE_QUEUE.push(DiscordLog.getMessageQueueObj(webhookName, title, message, decimalColour))
    LOG_QUEUE_EMITTER.emit("event")
  }

  /**
   * Convert Hex colour string to decimal used by Discord webhooks
   * @param hex input colour
   * @returns {number} converted decimal colour
   */
  private static getDecimalFromHexString (hex: string): number {
    hex = hex.toString().replace("#", "")
    return parseInt(hex, 16)
  }


  /**
   * Create basic Discord webhook object.
   * Has not converted webhookname to id + token yet.
   * @returns {{postContent: {wait: boolean, embeds: [{color: *, description: *, title: *, timestamp: *}]}, webhookName: *}}
   */
  private static getMessageQueueObj (webhookName: string, title: string, message: unknown, decimalColour: string | number): IMsgQueueObj {
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
        let request = Object.assign({}, DISCORD_REQUEST_TEMPLATE)
        if (messageQueueObj.webhookName === "custom") {
          request.path += messageQueueObj.id + "/" + messageQueueObj.token
        } else {
          // @ts-ignore TODO: don't ignore this. But idk enough about TypeScript to not ignore it currently.
          request.path += `${config.discord[messageQueueObj.webhookName].id}/${config.discord[messageQueueObj.webhookName].token}`
        }
        let req = https.request(request, (res) => {
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

const MESSAGE_QUEUE: IMsgQueueObj[] = []
const LOG_QUEUE_EMITTER = new EventEmitter()
LOG_QUEUE_EMITTER.on('event', DiscordLog.queueRunner)

let QUEUE_BEING_CHECKED = false
