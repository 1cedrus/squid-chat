// Generated by dedot cli

import type { AccountId32 } from "dedot/codecs";

export type InkStorageLazyMapping = {};

export type SquidchatChannel = {
  owner: AccountId32;
  name: string;
  imgUrl?: string | undefined;
};

export type InkStorageTraitsImplsResolverKey = {};

export type InkStorageTraitsImplsAutoKey = {};

export type InkStorageTraitsImplsManualKey = {};

export type SquidchatRequest = {
  sender: AccountId32;
  channelId: number;
  approval?: boolean | undefined;
  requestedAt: bigint;
};

export type SquidchatMessage = {
  sender: AccountId32;
  content: string;
  sendAt: bigint;
};

export type InkStorageLazy = {};

export type SquidchatSquidChat = {
  channels: InkStorageLazyMapping;
  channelToMembers: InkStorageLazyMapping;
  memberToChannels: InkStorageLazyMapping;
  requests: InkStorageLazyMapping;
  pendingRequests: InkStorageLazyMapping;
  registrantToRequest: InkStorageLazyMapping;
  messages: InkStorageLazyMapping;
  channelNonce: InkStorageLazy;
  requestNonce: InkStorageLazy;
  messageNonce: InkStorageLazyMapping;
};

export type InkPrimitivesLangError = "CouldNotReadInput";

export type SquidchatPendingRequestRecord = {
  channelId: number;
  requestId: number;
  request: SquidchatRequest;
};

export type SquidchatErrorsSquidChatError =
  | { type: "UnAuthorized" }
  | { type: "Custom"; value: string };

export type SquidchatChannelRecord = {
  channelId: number;
  channel: SquidchatChannel;
};

export type SquidchatPagination = {
  items: Array<SquidchatChannelRecord>;
  from: number;
  perPage: number;
  hasNextPage: boolean;
  total: number;
};

export type SquidchatPagination002 = {
  items: Array<AccountId32>;
  from: number;
  perPage: number;
  hasNextPage: boolean;
  total: number;
};

export type SquidchatPagination003 = {
  items: Array<SquidchatRequest>;
  from: number;
  perPage: number;
  hasNextPage: boolean;
  total: number;
};

export type SquidchatApprovalSubmissionResult = {
  approved: number;
  rejected: number;
  notFound: number;
};

export type SquidchatPagination004 = {
  items: Array<SquidchatMessageRecord>;
  from: number;
  perPage: number;
  hasNextPage: boolean;
  total: number;
};

export type SquidchatMessageRecord = {
  messageId: number;
  message: SquidchatMessage;
};

export type InkEnvNoChainExtension = null;
