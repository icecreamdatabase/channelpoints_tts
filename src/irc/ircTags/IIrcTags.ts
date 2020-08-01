"use strict"

// @badge-info=;badges=moderator/1,bits/1000;color=;display-name=ChannelPoints_TTS;emote-sets=0,296564,329101,342450,1082665,1230890,1381696,300374282,300979940,301391271,472873131,488737509,537206155,966632025;mod=1;subscriber=0;user-type=mod :tmi.twitch.tv USERSTATE #icdb
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

export interface IUserState {
  "tags": IUserStateTags,
  "command": "USERSTATE",
  "prefix": "tmi.twitch.tv",
  "param": string,
  "trailing": ""
}


// @emote-only=0;followers-only=-1;r9k=0;rituals=0;room-id=38949074;slow=0;subs-only=0 :tmi.twitch.tv ROOMSTATE #icdb
