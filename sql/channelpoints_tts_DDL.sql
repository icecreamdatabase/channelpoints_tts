create table botData
(
    id          int auto_increment
        primary key,
    `key`       varchar(45)                           not null,
    value       varchar(255)                          not null,
    lastUpdated timestamp default current_timestamp() not null on update current_timestamp(),
    constraint botdata_key_uindex
        unique (`key`)
);

create table channels
(
    roomId                int                                   not null
        primary key,
    channelName           varchar(45)                           not null,
    enabled               bit       default b'1'                not null,
    isTwitchPartner       bit       default b'0'                not null,
    maxMessageLength      int       default 450                 not null,
    minCooldown           int       default 0                   not null,
    timeoutCheckTime      int       default 2                   not null,
    addDate               timestamp default current_timestamp() not null,
    ircMuted              bit       default b'0'                not null,
    isQueueMessages       bit       default b'1'                not null,
    volume                int       default 100                 not null,
    canModsChangeSettings bit       default b'1'                not null
);

create table channelUserBlacklist
(
    roomId  int                                  not null,
    userId  int                                  not null,
    addDate datetime default current_timestamp() not null,
    primary key (roomId, userId),
    constraint channelUserBlacklist_channels_roomId_fk
        foreign key (roomId) references channels (roomId)
            on delete cascade
);

create table globalUserBlacklist
(
    userId  int                                  not null
        primary key,
    addDate datetime default current_timestamp() not null
);

create table voices
(
    id        int auto_increment
        primary key,
    voiceId   varchar(45) not null,
    voiceName varchar(45) not null,
    language  varchar(45) not null,
    constraint voices_voiceId_uindex
        unique (voiceId)
);

create table allowedConversationVoices
(
    roomId   int not null,
    voicesId int not null,
    primary key (roomId, voicesId),
    constraint allowedConversationVoices_channels_roomId_fk
        foreign key (roomId) references channels (roomId)
            on delete cascade,
    constraint allowedConversationVoices_voices_voicesId_fk
        foreign key (voicesId) references voices (id)
            on delete cascade
);

create table rewardVoice
(
    id             int auto_increment
        primary key,
    roomId         int              not null,
    rewardId       varchar(45)      not null,
    voicesId       int              not null,
    isConversation bit default b'1' not null,
    isSubOnly      bit default b'0' not null,
    cooldown       int default 0    not null,
    constraint rewardVoice_rewardId_uindex
        unique (rewardId),
    constraint rewardVoice_channels_roomId_fk
        foreign key (roomId) references channels (roomId)
            on delete cascade,
    constraint rewardVoice_voices_voicesId_fk
        foreign key (voicesId) references voices (id)
            on delete cascade
);

create table ttsLog
(
    id         int auto_increment
        primary key,
    roomId     int                                                                                                          not null,
    userId     int                                                                                                          not null,
    rawMessage varchar(512)                                                                                                 not null,
    voicesId   int                                                                                                          not null,
    wasSent    bit       default b'1'                                                                                       not null,
    userLevel  tinyint                                                                                                      not null,
    status     enum ('sent', 'skippedByNext', 'skippedByMod', 'failedTimedOut', 'failedSubmode', 'failedCooldown', 'error') not null,
    TIMESTAMP  timestamp default current_timestamp()                                                                        not null,
    messageId  varchar(36)                                                                                                  not null,
    constraint ttsLog_voices_id_fk
        foreign key (voicesId) references voices (id)
);

create index ttsLog_roomId_index
    on ttsLog (roomId);

create index ttsLog_userId_index
    on ttsLog (userId);

create index ttsLog_voicesId_index
    on ttsLog (voicesId);

create index ttsLog_wasSent_index
    on ttsLog (wasSent);

create table ttsQueue
(
    id            int auto_increment
        primary key,
    roomId        int                                   not null,
    userId        int                                   not null,
    userName      varchar(26)                           not null,
    color         varchar(7)                            null,
    userLevel     tinyint                               not null,
    rawMessage    varchar(512)                          not null,
    msgTimestamp  timestamp default current_timestamp() not null on update current_timestamp(),
    messageId     varchar(36)                           not null,
    rewardVoiceId int                                   not null,
    constraint ttsQueue_rewardVoice_id_fk
        foreign key (rewardVoiceId) references rewardVoice (id)
);

