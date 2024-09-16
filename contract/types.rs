use ink::{ prelude::string::String, primitives::AccountId };
use ink::prelude::vec::Vec;

pub type ChatHash = [u8; 16];
pub type MessageId = u32;
pub type Timestamp = u64;

#[ink::scale_derive(Encode, Decode, TypeInfo)]
#[cfg_attr(
  feature = "std",
  derive(ink::storage::traits::StorageLayout)
  )]
pub struct Chat {
  pub sprayed: bool,
  pub initializer: AccountId,
  pub peer: AccountId,
  pub initialized_at: Timestamp,  
}

#[ink::scale_derive(Encode, Decode, TypeInfo)]
pub struct ChatRecord {
  pub chat_hash: ChatHash,
  pub chat: Chat,
} 

#[ink::scale_derive(Encode, Decode, TypeInfo)]
#[cfg_attr(
  feature = "std",
  derive(ink::storage::traits::StorageLayout)
  )]
pub struct Message {
  pub sender: AccountId,
  pub content: String,
  pub send_at: Timestamp,
}

#[ink::scale_derive(Encode, Decode, TypeInfo)]
pub struct MessageRecord {
  pub message_id: MessageId,
  pub message: Message,
}

#[ink::scale_derive(Encode, Decode, TypeInfo)]
pub struct Pagination<Item> {
  pub items: Vec<Item>,
  pub from: u32,
  pub per_page: u32,
  pub has_next_page: bool,
  pub total: u32,
}

