"use strict"
// noinspection JSUnusedGlobalSymbols

export enum TimeConversion {
  YearToSeconds = 31556952,
  MonthToSeconds = 2592000,
  DayToSeconds = 86400,
  HourToSeconds = 3600,
  MinuteToSeconds = 60,
  SecondsToMilliseconds = 1000
}

export enum ChatLimit {
  NORMAL = 30,
  NORMAL_MOD = 100,
  KNOWN = 50,
  KNOWN_MOD = 50,
  VERIFIED = 7500,
  VERIFIED_MOD = 7500,
}

export enum IrcWsCmds {
  AUTH = "auth",
  JOIN = "join",
  PART = "part",
  SET_CHANNELS = "set_channels",
  SEND = "send", // send to irc
  RECEIVE = "receive", // receive from irc
  REMOVE_BOT = "remove_bot",
  GET_IRC_STATES = "ircstates"
}

export enum UserLevels {
  DEFAULT = 0,
  PLEB = 0,
  USER = 0,
  SUB = 1,
  FOUNDER = 1,
  SUBSCRIBER = 1,
  VIP = 2,
  MOD = 3,
  MODERATOR = 3,
  BROADCASTER = 4,
  BOTADMIN = 5,
  BOTOWNER = 6
}
