#![cfg_attr(not(feature = "std"), no_std, no_main)]

mod errors; 
mod events;
mod types;
mod macros;

pub use errors::SquidChatError;
pub use events::{ ChannelCreated, MessageSent, MessageDeleted, MemberLeft, MemberJoined };
pub use types::{ Channel, ChannelId, ChannelRecord, Message, MessageId, MessageRecord, Request, RequestApproval, RequestId, RequestRecord, ApprovalSubmissionResult, Pagination };

#[ink::contract]
mod squidchat {
  use core::usize;
  use crate::{ ensure, ApprovalSubmissionResult, SquidChatError, Channel, ChannelId, ChannelRecord, Message, MessageId, MessageRecord, Pagination, Request, RequestApproval, RequestId, RequestRecord, MessageSent, ChannelCreated, MessageDeleted, MemberJoined, MemberLeft };

  use ink::prelude::string::String;
  use ink::prelude::vec::Vec;
  use ink::storage::{ Mapping, Lazy };

  type SquidChatResult<T> = Result<T, SquidChatError>;

  #[ink(storage)]
  #[derive(Default)]
  pub struct SquidChat {
    channels: Mapping<ChannelId, Channel>,
    channel_to_members: Mapping<ChannelId, Vec<AccountId>>,
    member_to_channels: Mapping<AccountId, Vec<ChannelId>>,

    requests: Mapping<RequestId, Request>,
    pending_requests: Mapping<ChannelId, Vec<RequestId>>,
    registrant_to_request: Mapping<(AccountId, ChannelId), RequestId>,

    messages: Mapping<(ChannelId, MessageId), Message>,

    channel_nonce: Lazy<u32>,
    request_nonce: Lazy<u32>,
    message_nonce: Mapping<ChannelId, u32>,
  }

  impl SquidChat {
    #[ink(constructor)]
    pub fn new() -> Self {
      SquidChat::default()
    }

    #[ink(message)]
    pub fn pending_requests_count(&self, channel_id: ChannelId) -> SquidChatResult<u32> {
      self._ensure_channel_exists(channel_id)?;

      Ok(self.pending_requests.get(channel_id).unwrap_or_default().len() as u32)
    }

    #[ink(message)]
    pub fn message_nonce(&self, channel_id: ChannelId) -> SquidChatResult<u32> {
      self._ensure_channel_exists(channel_id)?;

      Ok(self.message_nonce.get(channel_id).unwrap_or_default())
    }

    #[ink(message)]
    pub fn get_channel_members(&self, channel_id: ChannelId) -> SquidChatResult<Vec<AccountId>> {
      self._ensure_channel_exists(channel_id)?;

      Ok(self.channel_to_members.get(channel_id).unwrap_or_default())
    }

    #[ink(message)]
    pub fn get_member_channels(&self, who: AccountId) -> Vec<ChannelRecord> {
      self.member_to_channels.get(who).unwrap_or_default().iter().map(|&channel_id| ChannelRecord {
        channel_id,
        channel: self.channels.get(channel_id).unwrap()
      }).collect()
    }

    #[ink(message)]
    pub fn get_channel_info(&self, channel_id: ChannelId) -> SquidChatResult<Channel> {
      self._ensure_channel_exists(channel_id)
    }

    #[ink(message)]
    pub fn list_channels(&self, from: u32, per_page: u32) -> Pagination<ChannelRecord> {
      let per_page = per_page.min(50); // limit per page at max 50 items
      let last_position = from.saturating_add(per_page);
      let total = self.channel_nonce.get_or_default();
      let has_next_page = total > (last_position);

      let mut items = Vec::new();
      for channel_id in from..last_position.min(total) {
        if let Some(channel) = self.channels.get(channel_id) {
          items.push(ChannelRecord {
            channel_id,
            channel
          });
        }
      }

      Pagination {
        items,
        from,
        per_page,
        has_next_page,
        total,
      }
    }

    #[ink(message)]
    pub fn new_channel(&mut self, name: String, img_url: Option<String>) -> SquidChatResult<ChannelId> {
      let sender = self.env().caller();

      let channel_id = self.channel_nonce.get_or_default();
      let next_channel_id = channel_id.checked_add(1).expect("Exceeds number of channels!");

      let channel = Channel::new(sender, name, img_url);

      self.channels.insert(channel_id, &channel);
      self.channel_nonce.set(&next_channel_id);
      self._add_member(sender, channel_id)?;

      self.env().emit_event(ChannelCreated {
        channel_id,
      });

      Ok(channel_id)
    }

    #[ink(message)]
    pub fn update_channel(&mut self, channel_id: ChannelId, name: String, img_url: Option<String>) -> SquidChatResult<()> {
      ensure!(self.channels.contains(channel_id), SquidChatError::Custom(String::from("ChannelNotExists")));

      let sender = self.env().caller();
      let mut channel = self.channels.get(channel_id).unwrap();
      ensure!(channel.is_owner(sender), SquidChatError::UnAuthorized);

      channel.update(name, img_url);

      self.channels.insert(channel_id, &channel);

      Ok(())
    }

    #[ink(message)]
    pub fn list_members(&self, channel_id: ChannelId, from: u32, per_page: u32) -> Pagination<AccountId> {
      let members = self.channel_to_members.get(channel_id).unwrap_or_default();
      let per_page = per_page.min(50);
      let last_position = from.saturating_add(per_page);
      let total = members.len() as u32;
      let has_next_page = total > last_position;

      let items: Vec<AccountId> = members.get(from as usize..last_position.min(total) as usize).unwrap_or_default().to_vec();

      Pagination {
        items,
        from,
        per_page,
        has_next_page,
        total,
      }
    }

    #[ink(message)]
    pub fn list_pending_requests(&self, channel_id: ChannelId, from: u32, per_page: u32) -> Pagination<RequestRecord> {
      let pending_requests = self.pending_requests.get(channel_id).unwrap_or_default();
      let per_page = per_page.min(50);
      let last_position = from.saturating_add(per_page);
      let total = pending_requests.len() as u32;
      let has_next_page = total > last_position;

      let requests: Option<&[RequestId]> = pending_requests.get(from as usize..last_position.min(total) as usize);
      let items = match requests {
        Some(requests) => requests.iter().map(|&request_id| {
          RequestRecord {
            request_id,
            request: self.requests.get(request_id).unwrap()
          }
        }).collect(),
        None => Vec::new(),
      };

      Pagination {
        items,
        from,
        per_page,
        has_next_page,
        total,
      }
    }

    #[ink(message)]
    pub fn send_request(&mut self, channel_id: ChannelId) -> SquidChatResult<RequestId> {
      let sender = self.env().caller();
      let _channel = self._ensure_channel_exists(channel_id)?;

      ensure!(!self._is_member(None, channel_id)?, SquidChatError::Custom(String::from("The sender is already a member of the channel!")));

      let maybe_request_id = self.registrant_to_request.get((sender, channel_id));
      if let Some(request_id) = maybe_request_id {
        ensure!(
          !self.pending_requests.get(channel_id).unwrap_or_default().contains(&request_id),
          SquidChatError::Custom(String::from("The registrant is already having a pending request!"))
          );
      }

      let request = Request {
        sender,
        channel_id,
        approval: None,
        requested_at: self.env().block_timestamp(),
      };

      let request_id = self.request_nonce.get_or_default();
      let next_request_id = request_id.checked_add(1).expect("Exceeds number of requests!");

      self.requests.insert(request_id, &request);
      self.registrant_to_request.insert((sender, channel_id), &request_id);

      let mut pending_requests = self.pending_requests.get(channel_id).unwrap_or_default();
      pending_requests.push(request_id);

      self.pending_requests.insert(channel_id, &pending_requests);
      self.request_nonce.set(&next_request_id);

      Ok(request_id)
    }

    #[ink(message)]
    pub fn approve_request(&mut self, channel_id: ChannelId, approvals: Vec<RequestApproval>) -> SquidChatResult<ApprovalSubmissionResult> {
      let channel = self._ensure_channel_exists(channel_id)?;
      ensure!(channel.is_owner(Self::env().caller()), SquidChatError::UnAuthorized);

      let mut approved_count: u32 = 0;
      let mut rejected_count: u32 = 0;
      let mut not_found_count: u32 = 0;

      let mut submitted_request_ids: Vec<RequestId> = Vec::new();
      for approval in approvals {
        let (who, approved) = approval;
        if let Some((request_id, mut request)) = self._get_pending_request(who, channel_id) {
          submitted_request_ids.push(request_id);

          if approved {
            // Add member & update request  
            self._add_member(who, channel_id)?;

            approved_count = approved_count.saturating_add(1);
          } else {
            rejected_count = rejected_count.saturating_add(1);
          }

          request.approval = Some(approved);
          self.requests.insert(request_id, &request);
        } else {
          not_found_count = not_found_count.saturating_add(1);
        }
      }

      // remove submitted request ids out of the pending request list
      let mut pending_requests = self.pending_requests.get(channel_id).unwrap_or_default();
      pending_requests.retain(|x| !submitted_request_ids.contains(x));

      self.pending_requests.insert(channel_id, &pending_requests);

      Ok(ApprovalSubmissionResult {
        approved: approved_count,
        rejected: rejected_count,
        not_found: not_found_count,
      })
    }

    #[ink(message)]
    pub fn leave_channel(&mut self, channel_id: ChannelId) -> SquidChatResult<()> {
      self._ensure_channel_exists(channel_id)?;
      ensure!(self._is_member(None, channel_id)?, SquidChatError::Custom(String::from("Isn't member in the channel!")));

      let sender = self.env().caller();
      self._remove_member(sender, channel_id)?;

      Ok(())
    }

    #[ink(message)]
    pub fn kick_member(&mut self, who: AccountId, channel_id: ChannelId) -> SquidChatResult<()> {
      let caller = self.env().caller();
      let channel = self._ensure_channel_exists(channel_id)?;
      ensure!(channel.is_owner(caller), SquidChatError::UnAuthorized);

      self._remove_member(who, channel_id)?;

      Ok(())
    }

    #[ink(message)]
    pub fn list_messages(&mut self, channel_id: ChannelId, from: u32, per_page: u32) -> Pagination<MessageRecord> {
      let per_page = per_page.min(50);
      let bounded_from = from.saturating_add(1);
      let last_position = from.saturating_sub(per_page);
      let total = self.message_nonce.get(channel_id).unwrap_or_default();
      let has_next_page = total > last_position;

      let mut items = Vec::new();
      for message_id in (last_position..bounded_from.min(total)).rev() {
        if let Some(message) = self.messages.get((channel_id, message_id)) {
          items.push(MessageRecord {
            message_id,
            message
          });
        }
      }

      Pagination {
        items,
        from,
        per_page,
        has_next_page,
        total,
      }
    }

    #[ink(message)]
    pub fn send_message(&mut self, channel_id: ChannelId, content: String) -> SquidChatResult<MessageId> {
      self._ensure_channel_exists(channel_id)?;
      ensure!(self._is_member(None, channel_id)?, SquidChatError::Custom(String::from("The sender is not a member of the channel!")));

      let sender = self.env().caller();
      let message_id = self.message_nonce.get(channel_id).unwrap_or_default();
      let next_message_id = message_id.saturating_add(1);

      let message = Message {
        sender,
        content,
        send_at: self.env().block_timestamp(),
      };

      self.messages.insert((channel_id, message_id), &message);
      self.message_nonce.insert(channel_id, &next_message_id);

      self.env().emit_event(MessageSent {
        channel_id,
        message_id,
      });

      Ok(message_id)
    }

    #[ink(message)]
    pub fn remove_message(&mut self, channel_id: ChannelId, message_id: MessageId) -> SquidChatResult<()> {
      let sender = self.env().caller();
      let channel = self._ensure_channel_exists(channel_id)?;
      let message = self.messages.get((channel_id, message_id)).unwrap();

      ensure!(self._is_member(None, channel_id)?, SquidChatError::Custom(String::from("The sender is not a member of the channel!")));
      ensure!(message.sender == sender || channel.is_owner(sender), SquidChatError::UnAuthorized);

      self.messages.remove((channel_id, message_id));

      self.env().emit_event(MessageDeleted {
        channel_id,
        message_id,
      });

      Ok(())
    }

    pub fn _ensure_channel_exists(&self, channel_id: ChannelId) -> SquidChatResult<Channel> {
      ensure!(self.channels.contains(channel_id), SquidChatError::Custom(String::from("ChannelNotExists")));

      Ok(self.channels.get(channel_id).unwrap())
    }

    pub fn _remove_member(&mut self, who: AccountId, channel_id: ChannelId) -> SquidChatResult<()> {
      let caller = self.env().caller();
      let channel = self._ensure_channel_exists(channel_id)?;
      ensure!(channel.is_owner(caller), SquidChatError::UnAuthorized);

      let mut members = self.channel_to_members.get(channel_id).unwrap_or_default();
      let mut member_channels = self.member_to_channels.get(who).unwrap_or_default();

      ensure!(members.contains(&who), SquidChatError::Custom(String::from("Isn't member in the channel!")));
      ensure!(member_channels.contains(&channel_id), SquidChatError::Custom(String::from("Isn't member in the channel!")));

      members.retain(|x| *x != who);
      member_channels.retain(|x| *x != channel_id);

      self.member_to_channels.insert(who, &member_channels);
      self.channel_to_members.insert(channel_id, &members);

      self.env().emit_event(MemberLeft {
        channel_id,
        account_id: who,
      });

      Ok(())
    }

    pub fn _add_member(&mut self, who: AccountId, channel_id: ChannelId) -> SquidChatResult<()> {
      let caller = self.env().caller();
      let channel = self._ensure_channel_exists(channel_id)?;
      ensure!(channel.is_owner(caller), SquidChatError::UnAuthorized);

      let mut members = self.channel_to_members.get(channel_id).unwrap_or_default();
      let mut member_channels = self.member_to_channels.get(who).unwrap_or_default();

      ensure!(!members.contains(&who), SquidChatError::Custom(String::from("The member is already in the channel!")));
      ensure!(!member_channels.contains(&channel_id), SquidChatError::Custom(String::from("The member is already in the channel!")));

      member_channels.push(channel_id);
      members.push(who); 

      self.member_to_channels.insert(who, &member_channels);
      self.channel_to_members.insert(channel_id, &members);

      self.env().emit_event(MemberJoined {
        channel_id,
        account_id: who,
      });

      Ok(())
    }

    pub fn _is_member(&self, who: Option<AccountId>, channel_id: ChannelId) -> SquidChatResult<bool> {
      self._ensure_channel_exists(channel_id)?;

      let who = who.unwrap_or(self.env().caller());
      let members = self.channel_to_members.get(channel_id).unwrap_or_default(); 

      Ok(members.contains(&who))
    }

    pub fn _get_pending_request(&self, who: AccountId, channel_id: ChannelId) -> Option<(RequestId, Request)> {
      let maybe_request_id = self.registrant_to_request.get((who, channel_id));

      match maybe_request_id {
        None => None,
        Some(request_id) => {
          if self.pending_requests.get(channel_id).unwrap_or_default().contains(&request_id) {
            Some((request_id, self.requests.get(request_id).unwrap()))
          } else {
            None
          }
        },
      }
    }
  }
}


