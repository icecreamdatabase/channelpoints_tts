"use strict"

export interface IIrcBase {
  "tags": IClearChatTags | IUserStateTags,
  "command": "CLEARCHAT" | "CLEARMSG" | "GLOBALUSERSTATE" | "PRIVMSG" | "ROOMSTATE" | "USERNOTICE" | "USERSTATE",
  "prefix": "tmi.twitch.tv",
  "param": string, // #roomName
  "trailing": string
}

export interface IClearChatTags {
  "ban-duration"?: number, // undefined = perm ban
  "room-id": string,
  "target-user-id": string,
  "tmi-sent-ts": string //TODO make this date somehow
}

export interface IClearChat extends IIrcBase {
  "tags": IClearChatTags,
  "command": "CLEARCHAT"
  "trailing": string // Timed out user
}

export interface IUserStateTags {
  "badge-info": true | string,
  "badges": true | string, //"moderator/1,bits/1000",
  "color": true | string,
  "display-name": string,
  "emote-sets": true | string,
  "mod": boolean, // deprecated
  "subscriber": boolean, // deprecated
  "user-type": "empty" | "mod" | "global_mod" | "admin" | "staff" // deprecated
}

export interface IUserState extends IIrcBase {
  "tags": IUserStateTags,
  "command": "USERSTATE",
  "trailing": ""
}


