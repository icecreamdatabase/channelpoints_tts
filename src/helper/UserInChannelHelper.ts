"use strict"


import {ApiOther} from "../api/Api"

export class UserInChannelHelper {
  private static readonly userInChannel: Map<string, Set<string>> = new Map<string, Set<string>>()

  /**
   * Check if a user was seen in a channel before since bot start.
   * Fetches chatters "api" if not to check.
   */
  public static async checkUserWasInChannel (channelName: string, userName: string): Promise<boolean> {
    const users = UserInChannelHelper.getSetFromChannelName(channelName)

    if (users.has(userName)) {
      ApiOther.getAllUsersInChannel(channelName).then(newUsers => newUsers.forEach(x => users?.add(x)))
      return true
    } else {
      (await ApiOther.getAllUsersInChannel(channelName)).forEach(x => users?.add(x))
      return users.has(userName)
    }
  }

  public static addUsersToUserWasInChannelObj (channelName: string, userName: string): void {
    UserInChannelHelper.getSetFromChannelName(channelName).add(userName)
  }

  private static getSetFromChannelName (channelName: string): Set<string> {
    if (channelName.charAt(0) === '#') {
      channelName = channelName.substring(1)
    }
    let users: Set<string> | undefined = UserInChannelHelper.userInChannel.get(channelName)
    if (!users) {
      users = new Set<string>()
      UserInChannelHelper.userInChannel.set(channelName, users)
    }
    return users
  }
}
