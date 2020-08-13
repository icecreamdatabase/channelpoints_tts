"use strict"

export interface IKrakenError {
  message: string,
  status: number,
  error: string
}

/** kraken/users/XXXX */
export interface IKrakenUser {
  display_name: string,
  _id: string,
  name: string,
  type: string,
  bio: string,
  created_at: string,
  updated_at: string,
  logo: string
}

/** kraken/users?id= */
export interface IKrakenUsers {
  _total: number,
  users: IKrakenUser[]
}

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
export type IKrakenUsersChatChannel = IKrakenUsersChat

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

export interface IKrakenStream {
  _id: number,
  game: string,
  broadcast_platform: string,
  community_id: string,
  community_ids: string[], //TODO:???
  viewers: number,
  video_height: number,
  average_fps: number,
  delay: number,
  created_at: string,
  is_playlist: boolean,
  stream_type: string,
  preview: {
    small: string,
    medium: string,
    large: string,
    template: string
  },
  channel: IKrakenChannel
}

export interface IKrakenStreams {
  stream: null | IKrakenStream
}

export interface IKrakenChannelVideo {
  title: string,
  description: string | null,
  description_html: string | null,
  broadcast_id: number,
  broadcast_type: string,
  status: string,
  tag_list: string,
  views: number,
  url: string,
  language: string,
  created_at: string,
  viewable: string,
  viewable_at: null | string,
  published_at: string,
  delete_at: string,
  _id: string,
  recorded_at: string,
  game: string,
  length: number,
  preview: {
    small: string,
    medium: string,
    large: string,
    template: string
  },
  animated_preview_url: string,
  thumbnails: {
    small: {
      type: string,
      url: string
    }[],
    medium:
      {
        type: string,
        url: string
      }[],
    large: {
      type: string,
      url: string
    }[],
    template: {
      type: string,
      url: string
    }[]
  },
  fps: {
    chunked: number
  },
  seek_previews_url: string,
  resolutions: {
    chunked: string
  },
  restriction: string,
  channel: IKrakenChannel,
  increment_view_count_url: string
}

export interface IKrakenChannelVideos {
  _total: number,
  videos: IKrakenChannelVideo[]
}

export interface IKrakenFollowsChannel {
  created_at: string,
  channel: IKrakenChannel,
  notifications: boolean
}

