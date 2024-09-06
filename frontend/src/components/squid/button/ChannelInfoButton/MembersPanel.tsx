import { Flex, IconButton, Stack, StackDivider, Text } from "@chakra-ui/react";
import Identicon from "@polkadot/react-identicon";
import { shortenAddress } from "@/utils/string";
import { ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons";
import { useState } from "react";
import { useChannelContext } from "@/providers/ChannelProvider";

const RECORDS_PER_PAGE = 5;

export default function MembersPanel() {
  const { members } = useChannelContext();
  const [page, setPage] = useState(0);

  const numberOfMembers = members?.length || 0;

  return (
    <Flex direction="column" gap={4} minH="25rem">
      <Text
        fontSize="large"
        fontWeight={600}
      >{`Members (${numberOfMembers})`}</Text>
      <Stack direction="column" divider={<StackDivider />} flex={1}>
        {members
          ?.slice(
            page * RECORDS_PER_PAGE,
            page * RECORDS_PER_PAGE + RECORDS_PER_PAGE
          )
          ?.map((account) => (
            <Flex key={account.address()} align="center" gap={4}>
              <Identicon value={account.address()} size={40} theme="polkadot" />
              <Text fontWeight={500}>{shortenAddress(account.address())}</Text>
            </Flex>
          ))}
      </Stack>
      <Flex gap={2} alignSelf="end" justifySelf="end">
        <IconButton
          aria-label="Back"
          icon={<ChevronLeftIcon />}
          onClick={() => setPage((prev) => prev - 1)}
          isDisabled={page === 0}
        />
        <IconButton
          aria-label="Forward"
          icon={<ChevronRightIcon />}
          onClick={() => setPage((prev) => prev + 1)}
          isDisabled={numberOfMembers / RECORDS_PER_PAGE <= page + 1}
        />
      </Flex>
    </Flex>
  );
}
