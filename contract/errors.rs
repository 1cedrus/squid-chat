use ink::prelude::string::String;

#[ink::scale_derive(Encode, Decode, TypeInfo)]
pub enum SquidChatError {
  Custom(String),
}
