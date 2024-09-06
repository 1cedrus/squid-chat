use ink::{ prelude::string::String, primitives::AccountId };
use ink::prelude::vec::Vec;

pub type ChannelId = u32;

#[ink::scale_derive(Encode, Decode, TypeInfo)]
pub struct ChannelRecord {
  pub channel_id: ChannelId,
  pub channel: Channel,
} 

#[ink::scale_derive(Encode, Decode, TypeInfo)]
#[cfg_attr(
  feature = "std",
  derive(ink::storage::traits::StorageLayout)
  )]
pub struct Channel {
  owner: AccountId,
  name: String, 
  img_url: Option<String>,
}

impl Channel {
  pub fn new(owner: AccountId, name: String, img_url: Option<String>) -> Self {
    Channel {
      owner,
      name,
      img_url,
    }
  }

  pub fn update(&mut self, name: String, img_url: Option<String>) {
    self.name = name;
    self.img_url = img_url;
  }

  pub fn is_owner(&self, who: AccountId) -> bool {
    self.owner == who
  }
}

pub type RequestId = u32;
pub type RequestApproval = (AccountId, bool);

#[ink::scale_derive(Encode, Decode, TypeInfo)]
pub struct ApprovalSubmissionResult {
  pub approved: u32,
  pub rejected: u32,
  pub not_found: u32,
}

#[cfg_attr(
  feature = "std",
  derive(ink::storage::traits::StorageLayout)
  )]
#[ink::scale_derive(Encode, Decode, TypeInfo)]
pub struct Request {
  pub sender: AccountId,
  pub channel_id: u32,
  pub approval: Option<bool>,
  pub requested_at: Timestamp,
}

pub type MessageId = u32;

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

pub type Timestamp = u64;

#[ink::scale_derive(Encode, Decode, TypeInfo)]
pub struct PendingRequestRecord {
    pub channel_id: ChannelId,
    pub request_id: RequestId,
    pub request: Request,
}
