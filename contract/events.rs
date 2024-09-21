use ink::primitives::AccountId;

use crate::{ ChatHash, MessageId };

#[ink::event]
pub struct ChatInitialized {
  pub chat_hash: ChatHash,
  pub initializer: AccountId,
  pub peer: AccountId,
}

#[ink::event]
pub struct MessageSent {
  pub channel_id: ChatHash,
  pub message_id: MessageId,
}

#[ink::event]
pub struct Gripped {
  pub chat_hash: ChatHash,
  pub approval: bool,
}

#[ink::event]
pub struct Sprayed {
  pub chat_hash: ChatHash,
  pub sprayer: AccountId,
}

