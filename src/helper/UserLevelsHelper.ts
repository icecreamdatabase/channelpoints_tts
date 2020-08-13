"use strict"

import {UserLevels} from "../Enums"

export class UserLevelsHelper {
  public static getUserLevel (badges: true | string): UserLevels {
    // If no badges are supplied the badges object gets parsed into "true"
    if (typeof badges !== "string") {
      return UserLevels.DEFAULT
    }

    const badgeSplit: string[] = badges.split(",")
    const badgeSplitUserLevels: UserLevels[] = <UserLevels[]>badgeSplit.map(x => {
      const badgeName: string = x.split("/")[0].toUpperCase()
      // If it's a valid key in UserLevels return the UserLevels value. Else return undefined which get filtered later on.
      if (badgeName in UserLevels) {
        return UserLevels[<keyof typeof UserLevels>badgeName]
      }
    }).filter(Boolean) // <-- This removes all undefined from the array. It makes UserLevels[] out of (UserLevels | undefined)
    badgeSplitUserLevels.push(UserLevels.DEFAULT)
    return Math.max(...badgeSplitUserLevels)
  }
}
