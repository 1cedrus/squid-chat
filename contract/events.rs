use ink::primitives::AccountId;
use ink::prelude::vec::Vec;

use crate::{ ChannelId, MessageId, RequestId };

#[ink::event]
pub struct ChannelCreated {
  pub channel_id: ChannelId,
  pub owner: AccountId,
}

#[ink::event]
pub struct ChannelUpdated {
  pub channel_id: ChannelId,
  pub owner: AccountId,
}

#[ink::event]
pub struct MessageSent {
  pub channel_id: ChannelId,
  pub message_id: MessageId,
}

#[ink::event]
pub struct RequestSent {
  pub channel_id: ChannelId,
  pub sender: AccountId,
}

#[ink::event]
pub struct RequestCancelled {
  pub channel_id: ChannelId,
  pub sender: AccountId,
}

#[ink::event]
pub struct MessageDeleted {
  pub channel_id: ChannelId,
  pub message_id: MessageId,
}

#[ink::event]
pub struct ApprovalSubmitted {
  pub channel_id: ChannelId,
  pub approved: Vec<RequestId>,
  pub rejected: Vec<RequestId>,
}

#[ink::event]
// Currently MemberLeft events is used for both MemberLeft and MemberKicked
pub struct MemberLeft {
  pub channel_id: ChannelId,
  pub account_id: AccountId,
}

