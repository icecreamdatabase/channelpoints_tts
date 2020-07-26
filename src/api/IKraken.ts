"use strict"

/** kraken/users/XXXX/chat */
export interface IKrakenUsersChat {
  id: string,
  login: string,
  displayName: string,
  color: string,
  is_verified_bot: boolean,
  is_known_bot: boolean,
  Badges: {
    id: string,
    version: string
  }[]
}

/** kraken/users/XXXX/chat/channels/YYYY */
export interface IKrakenUsersChatChannel extends IKrakenUsersChat {
}

/** kraken/channels/XXXX */
export interface IKrakenChannel {
  mature: boolean,
  status: string,
  broadcaster_language: string,
  broadcaster_software: string,
  display_name: string,
  game: string,
  language: string,
  _id: string,
  name: string,
  created_at: string,
  updated_at: string,
  partner: boolean,
  logo: string,
  video_banner: string,
  profile_banner: string,
  profile_banner_background_color: string | null,
  url: string,
  views: number,
  followers: number,
  broadcaster_type: string,
  description: string,
  private_video: boolean,
  privacy_options_enabled: boolean
}

/** kraken/channels?id=XXXX,YYYY */
export interface IKrakenChannels {
  _total: number,
  channels: IKrakenChannel[]
}

export interface IKrakenFollowsChannel {
  created_at: string,
  channel: IKrakenChannel,
  notifications: boolean
}

