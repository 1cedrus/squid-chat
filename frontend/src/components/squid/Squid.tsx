import { Center, CircularProgress, Flex } from "@chakra-ui/react";
import ChannelList from "@/components/squid/ChannelList";
import ChannelBox from "@/components/squid/ChannelBox";
import { useSquidContext } from "@/providers/SquidProvider";
import AddChannelButton from "@/components/squid/button/AddChannelButton";
import ChannelProvider from "@/providers/ChannelProvider";

export default function Squid() {
  const { selectedChannel, selectedAccountChannels, isLoading } =
    useSquidContext();

  if (isLoading) {
    return (
      <Flex direction="column" align="center" w="full">
        <CircularProgress isIndeterminate color="gray" />
      </Flex>
    );
  }

  if (selectedChannel === undefined || selectedAccountChannels?.length === 0) {
    return (
      <Flex direction="column" align="center" w="full" gap={4}>
        <Center>
          Join a channel or create one to start chatting with your friends
        </Center>
        <AddChannelButton />
      </Flex>
    );
  }

  return (
    <ChannelProvider selectedChannel={selectedChannel} key={selectedChannel}>
      <Flex gap={2} w="full">
        <ChannelList />
        <ChannelBox />
      </Flex>
    </ChannelProvider>
  );
}
