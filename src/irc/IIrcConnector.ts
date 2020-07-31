"use strict"

import {UserLevels} from "../Enums"

export interface IWsDataMain {
  cmd: string,
  data: IWsDataData,
  version?: string,
  applicationId?: number | string
}

export interface IWsDataAuth {
  userId: number, // TODO: make this botUserId
  userName: string, // TODO: make this botUserName
  accessToken: string,
  rateLimitModerator: number,
  rateLimitUser: number
}

export interface IWsDataJoinPartSet {
  botUserId: number,
  channelNames: string[]
}

export interface IWsDataSend {
  botUserId: number,
  channelName: string,
  message: string,
  userId?: number,
  botStatus: UserLevels
  useSameSendConnectionAsPrevious?: boolean, // undefined = automatic detection based on message splitting.
  maxMessageLength: number
}

export type IWsDataReceive = any[]// TODO: Make this proper

export interface IWsDataRemoveBot {
  userId: number // TODO: make this botUserId
}

export interface IWsDataRequestIrcStates {
  botUserId: number
}

export type IWsDataData = IWsDataAuth | IWsDataJoinPartSet | IWsDataSend | IWsDataReceive | IWsDataRemoveBot | IWsDataRequestIrcStates
