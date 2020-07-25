"use strict"
import Axios from "axios"

//TODO: use custom axois instances https://www.npmjs.com/package/axios

export class Other {

  /**
   * Get a list of users in a channel
   * @param channelName channel to check
   * @returns {Promise<string[]>} array of chatters
   */
  static async getAllUsersInChannel (channelName: string): Promise<string[]> {
    if (channelName.charAt(0) === '#') {
      channelName = channelName.substring(1)
    }
    let chattersObj = (await Axios(`https://tmi.twitch.tv/group/user/${channelName}/chatters`)).data
    if (Object.prototype.hasOwnProperty.call(chattersObj, "chatters")) {
      return [].concat.apply([], Object.values(chattersObj.chatters))
    }
    return []
  }

  /**
   * Check if user is in chatters list
   * @param loginToCheck
   * @param channelName
   * @returns {Promise<boolean>}
   */
  static async isUserInChannel (loginToCheck: string, channelName: string): Promise<boolean> {
    let allChatters = await this.getAllUsersInChannel(channelName)
    return this.stringEntryInArray(allChatters, loginToCheck)
  }

  /**
   * Case insensitive version of Array.includes()
   * @param array Array to check
   * @param entryToCheck Entry to check
   * @returns {boolean} includes
   */
  static stringEntryInArray (array: string[], entryToCheck: string): boolean {
    if (array.length > 0) {
      for (let entry of array) {
        if (entry.toLowerCase() === entryToCheck.toLowerCase()) {
          return true
        }
      }
    }
    return false
  }

  /**
   * Pings the Supinic api bot active endpoint.
   * Return true if sucessful or "If you authorize correctly, but you're not being tracked as a channel bot".
   * Else returns false
   * @param user supiniicApiUser
   * @param key supinicApiKey
   * @returns {Promise<boolean>} Was ping successful
   */
  static async supinicApiPing (user: number | string, key: string): Promise<boolean> {
    if (user && key) {
      try {
        await Axios({
          method: 'PUT',
          url: 'https://supinic.com/api/bot-program/bot/active',
          headers: {
            Authorization: `Basic ${user}:${key}`
          }
        })
        return true
      } catch (e) {
        return e.response.status === 400
      }
    }
    return false
  }

  /**
   * @param {string} url
   * @return {Promise<string>}
   */
  static async getWebsiteContent (url: string): Promise<string> {
    try {
      return (await Axios(url)).data
    } catch (e) {
      return e.response.data.toString()
    }
  }
}

