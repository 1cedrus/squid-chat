use ink::primitives::AccountId;

use crate::{ ChannelId, MessageId };

#[ink::event]
pub struct ChannelCreated {
  pub channel_id: ChannelId,
}

#[ink::event]
pub struct MessageSent {
  pub channel_id: ChannelId,
  pub message_id: MessageId,
}

#[ink::event]
pub struct MessageDeleted {
  pub channel_id: ChannelId,
  pub message_id: MessageId,
}

#[ink::event]
pub struct MemberJoined {
  pub channel_id: ChannelId,
  pub account_id: AccountId,
}

#[ink::event]
pub struct MemberLeft {
  pub channel_id: ChannelId,
  pub account_id: AccountId,
}

