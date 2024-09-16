#![cfg_attr(not(feature = "std"), no_std, no_main)]

mod errors; 
mod events;
mod types;
mod macros;

pub use errors::SquidChatError;
pub use events::{ MessageSent, ChatInitialized, Sprayed, Broken };
pub use types::{ Message, MessageId, MessageRecord, Pagination, Chat, ChatHash, ChatRecord };

#[ink::contract]
mod squidchat {
  use core::usize;
  use crate::{ ensure, Chat, SquidChatError, _blake2x_128, ChatHash, Message, MessageId, MessageRecord, Pagination, ChatRecord, Sprayed, Broken, MessageSent, ChatInitialized }; 

  use ink::prelude::string::String;
  use ink::prelude::vec::Vec;
  use ink::storage::Mapping ;
  use ink::prelude::string::ToString;

  type SquidChatResult<T> = Result<T, SquidChatError>;

  #[ink(storage)]
  #[derive(Default)]
  pub struct SquidChat {
    chats: Mapping<ChatHash, Chat>,
    squid_to_chats: Mapping<AccountId, Vec<ChatHash>>,
    messages: Mapping<(ChatHash, MessageId), Message>,

    message_nonce: Mapping<ChatHash, u32>,
  }

  impl SquidChat {
    #[ink(constructor)]
    pub fn new() -> Self {
      SquidChat::default()
    }

    #[ink(message)]
    pub fn squid(&self) -> Vec<ChatRecord> {
      let caller_chats = self.squid_to_chats.get(self.env().caller()).unwrap_or_default();

      caller_chats.iter().map(|chat_hash| {
        ChatRecord {
          chat_hash: *chat_hash,
          chat: self.chats.get(*chat_hash).unwrap()
        }
      }).collect()
    }

    #[ink(message)]
    pub fn chat(&self, chat_hash: ChatHash) -> Option<Chat> {
      self.chats.get(chat_hash)
    }

    #[ink(message)]
    pub fn init_chat(&mut self, peer: AccountId) -> SquidChatResult<ChatHash> {
      let initializer = self.env().caller();
      let initialized_at = self.env().block_timestamp();
      
      let chat = Chat {
        sprayed: false,
        initializer,
        peer,
        initialized_at,
      };

      let hash  = _blake2x_128(initialized_at.to_string().as_bytes());

      self.chats.insert(hash, &chat);
      
      let mut initializer_chats = self.squid_to_chats.get(initializer).unwrap_or_default();
      let mut peer_chats = self.squid_to_chats.get(peer).unwrap_or_default();

      initializer_chats.push(hash);
      peer_chats.push(hash);

      self.squid_to_chats.insert(initializer, &initializer_chats);
      self.squid_to_chats.insert(peer, &peer_chats);

      self.env().emit_event(ChatInitialized {
        chat_hash: hash,
        initializer,
        peer,
      });

      Ok(hash)
    }

    #[ink(message)]
    pub fn break_up(&mut self, chat_hash: ChatHash) -> SquidChatResult<()> {
      let breaker = self.env().caller();
      let breaker_chats = self.squid_to_chats.get(breaker).unwrap_or_default();

      ensure!(breaker_chats.contains(&chat_hash), SquidChatError::Custom(String::from("Chat not existed or breaker not in chat!")));

      let chat = self.chats.get(chat_hash).unwrap();
      
      let mut breaker_chats = self.squid_to_chats.get(breaker).unwrap_or_default();
      let mut peer_chats = self.squid_to_chats.get(chat.peer).unwrap_or_default();

      breaker_chats.retain(|x| *x != chat_hash);
      peer_chats.retain(|x| *x != chat_hash);

      self.squid_to_chats.insert(breaker, &breaker_chats);
      self.squid_to_chats.insert(chat.peer, &peer_chats);

      // TODO!: Consider to remove chat and messages

      self.env().emit_event(Broken {
        chat_hash,
        breaker,
      });

      Ok(())
    }
    
    #[ink(message)]
    pub fn spray(&mut self, chat_hash: ChatHash, approval: bool) -> SquidChatResult<()> {
      let sprayer = self.env().caller();
      let sprayer_chats = self.squid_to_chats.get(sprayer).unwrap_or_default();

      ensure!(sprayer_chats.contains(&chat_hash), SquidChatError::Custom(String::from("Chat not existed or breaker not in chat!")));

      let mut chat = self.chats.get(chat_hash).unwrap();

      ensure!(chat.peer == sprayer, SquidChatError::Custom(String::from("Only peer can spray!")));

      if approval {
        chat.sprayed = true; 
        self.chats.insert(chat_hash, &chat);
      } else {
        // TODO!: Consider to remove chat and messages
        
        let mut sprayer_chats = self.squid_to_chats.get(sprayer).unwrap_or_default();
        let mut peer_chats = self.squid_to_chats.get(chat.peer).unwrap_or_default();

        sprayer_chats.retain(|x| *x != chat_hash);
        peer_chats.retain(|x| *x != chat_hash);

        self.squid_to_chats.insert(sprayer, &sprayer_chats);
        self.squid_to_chats.insert(chat.peer, &peer_chats);
      }

      self.env().emit_event(Sprayed {
        chat_hash,
        approval,
      });

      Ok(())
    }

    #[ink(message)]
    pub fn list_messages(&self, chat_hash: ChatHash, from: u32, per_page: u32) -> Pagination<MessageRecord> {
      let per_page = per_page.min(50);
      let bounded_from = from.saturating_add(1);
      let last_position = from.saturating_sub(per_page);
      let total = self.message_nonce.get(chat_hash).unwrap_or_default();
      let has_next_page = total > last_position;

      let mut items = Vec::new();
      for message_id in (last_position..bounded_from.min(total)).rev() {
        if let Some(message) = self.messages.get((chat_hash, message_id)) {
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
    pub fn send(&mut self, chat_hash: ChatHash, content: String) -> SquidChatResult<MessageId> {
      let sender = self.env().caller();
      let chat = self.chats.get(chat_hash).unwrap();

      ensure!(chat.initializer == sender || chat.peer == sender, SquidChatError::Custom(String::from("Only initializer or peer can send message!")));

      if !chat.sprayed && chat.peer == sender {
        return Err(SquidChatError::Custom(String::from("Peer have not sprayed yet!")));
      }

      let message_id = self.message_nonce.get(chat_hash).unwrap_or_default();
      let next_message_id = message_id.saturating_add(1);

      let message = Message {
        sender,
        content,
        send_at: self.env().block_timestamp(),
      };

      self.messages.insert((chat_hash, message_id), &message);
      self.message_nonce.insert(chat_hash, &next_message_id);

      self.env().emit_event(MessageSent {
        channel_id: chat_hash,
        message_id,
      });

      Ok(message_id)
    }
  }
}

pub fn _blake2x_128(input: &[u8]) -> [u8; 16] {
  let mut output = <ink::env::hash::Blake2x128 as ink::env::hash::HashOutput>::Type::default();
  ink::env::hash_bytes::<ink::env::hash::Blake2x128>(input, &mut output);
  output
}

