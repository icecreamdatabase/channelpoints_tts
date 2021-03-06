"use strict"

export interface IIrcBase {
  "tags": IClearChatTags | IClearMsgTags | IPrivMsgTags | IUserStateTags,
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

export interface IClearMsgTags {
  "room-id": string,
  "target-msg-id": string,
  "tmi-sent-ts": string //TODO make this date somehow
}

export interface IClearMsg extends IIrcBase {
  "tags": IClearMsgTags,
  "command": "CLEARMSG"
  "trailing": string // Message timed out
}

export interface IPrivMsgTags {
  "badge-info": true | string,
  "badges": true | string,
  "color": true | string,
  "custom-reward-id"?: string
  "display-name": string,
  "emotes": true | string,
  "flags": true | string, // ???
  "id": string,
  "msg-id"?: "highlighted-message" | "skip-subs-mode-message",
  /** @deprecated */
  "mod": boolean,
  "reply-parent-display-name": string,
  /** spaces are /s */
  "reply-parent-msg-body": string,
  "reply-parent-msg-id": string,
  "reply-parent-user-id": string,
  "reply-parent-user-login": string,
  "room-id": string,
  /** @deprecated */
  "subscriber": boolean,
  "tmi-sent-ts": string //TODO make this date somehow
  /** @deprecated */
  "turbo": boolean,
  "user-id": string,
  /** @deprecated */
  "user-type": "empty" | "mod" | "global_mod" | "admin" | "staff"
}

export interface IPrivMsg extends IIrcBase {
  "tags": IPrivMsgTags,
  "command": "PRIVMSG"
  "trailing": string // Message sent
}


export interface IUserStateTags {
  "badge-info": true | string,
  "badges": true | string, //"moderator/1,bits/1000",
  "color": true | string,
  "display-name": string,
  "emote-sets": true | string,
  /** @deprecated */
  "mod": boolean,
  /** @deprecated */
  "subscriber": boolean,
  /** @deprecated */
  "user-type": "empty" | "mod" | "global_mod" | "admin" | "staff"
}

export interface IUserState extends IIrcBase {
  "tags": IUserStateTags,
  "command": "USERSTATE",
  "trailing": ""
}

