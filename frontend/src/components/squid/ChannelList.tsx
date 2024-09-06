import { Avatar, Wrap } from "@chakra-ui/react";
import { useSquidContext } from "@/providers/SquidProvider";
import AddChannelButton from "@/components/squid/button/AddChannelButton";

export default function ChannelList() {
  const { selectedChannel, setSelectedChannel, selectedAccountChannels } =
    useSquidContext();

  return (
    <Wrap
      direction="column"
      padding={2}
      border={1}
      borderStyle="solid"
      borderColor="gray.200"
      borderRadius={12}
    >
      {selectedAccountChannels?.map(
        ({ channelId, channel: { name, imgUrl } }) => (
          <Avatar
            key={channelId}
            as="button"
            onClick={() => {
              setSelectedChannel(channelId);
            }}
            name={name}
            src={imgUrl}
            _hover={{
              borderRadius: 10,
            }}
            sx={{
              "img:hover": { borderRadius: 10 },
            }}
            borderRadius={channelId === selectedChannel ? 10 : "100%"}
          />
        )
      )}
      <AddChannelButton />
    </Wrap>
  );
}
