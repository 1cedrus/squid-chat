import { ContractId } from "@/contracts/deployments";
import {
  SquidchatContractApi,
  SquidchatMessage,
} from "@/contracts/types/squidchat";
import useBalance from "@/hooks/useBalance";
import useContract from "@/hooks/useContract";
import useContractQuery from "@/hooks/useContractQuery";
import { useTypink } from "@/providers/TypinkProvider";
import {
  Flex,
  IconButton,
  Box,
  Text,
  Input,
  Center,
  Tooltip,
  CircularProgress,
} from "@chakra-ui/react";
import { ChevronRightIcon } from "@chakra-ui/icons";
import { useCallback, useEffect, useRef, useState } from "react";
import useWatchContractEvent from "@/hooks/useWatchContractEvent";
import { toast } from "react-toastify";
import { txToaster } from "@/utils/txToaster";
import useContractTx from "@/hooks/useContractTx";
import ChannelInfoButton from "./button/ChannelInfoButton";
import Identicon from "@polkadot/react-identicon";
import { shortenAddress } from "@/utils/string";
import { useChannelContext } from "@/providers/ChannelProvider";
import { useScroll } from "react-use";

const RECORDS_PER_PAGE = 15;

export default function ChannelBox() {
  const { messageNonce } = useChannelContext();

  // Just to make sure that message nonce is defined
  if (messageNonce === undefined) {
    return null;
  }

  return <ChannelBoxInner />;
}

function ChannelBoxInner() {
  const { selectedAccount } = useTypink();
  const { contract } = useContract<SquidchatContractApi>(ContractId.SQUIDCHAT);
  const { info, messageNonce, selectedChannel } = useChannelContext();
  const [message, setMessage] = useState("");
  const sendMessageTx = useContractTx(contract, "sendMessage");
  const balance = useBalance(selectedAccount?.address);
  const [renderMessages, setRenderMessages] = useState<
    Record<number, SquidchatMessage>
  >({});
  const [nonce, setNonce] = useState(messageNonce);
  const ref = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);
  const { y } = useScroll(ref);

  const {
    data: messages,
    isLoading,
    refresh,
  } = useContractQuery({
    contract,
    fn: "listMessages",
    args: [
      selectedChannel!,
      nonce! - page * RECORDS_PER_PAGE,
      RECORDS_PER_PAGE,
    ],
  });

  useEffect(() => {
    if (!messages) return;

    const { items, total } = messages;

    const tmp = items.reduce(
      (a, messageRecored) => {
        a[messageRecored.messageId] = messageRecored.message;
        return a;
      },
      {} as Record<number, SquidchatMessage>
    );

    setNonce(total);
    setRenderMessages((prev) => ({ ...prev, ...tmp }));
  }, [messages]);

  useEffect(() => {
    setRenderMessages({});
  }, [selectedChannel, messageNonce]);

  const handleSendMessage = async (event: any) => {
    event.preventDefault();

    if (!contract || !message) return;

    if (!selectedAccount) {
      toast.info("Please connect to your wallet");
      return;
    }

    if (balance === 0n) {
      toast.error("Balance insufficient to make transaction.");
      return;
    }

    const toaster = txToaster("Signing transaction...");

    try {
      await sendMessageTx.signAndSend({
        args: [selectedChannel!, message!],
        callback: ({ status }) => {
          console.log(status);

          toaster.updateTxStatus(status);
        },
      });
    } catch (e: any) {
      console.error(e, e.message);
      toaster.onError(e);
    } finally {
      refresh();
      setMessage("");
    }
  };

  useWatchContractEvent(
    contract,
    "MessageSent",
    useCallback((events) => {
      events.forEach((messageSentEvent) => {
        const {
          data: { channelId },
        } = messageSentEvent;

        if (channelId === selectedChannel) {
          setPage(0);
          refresh();
        }
      });
    }, [])
  );

  useEffect(() => {
    if (!isLoading && y < 100 && messages?.hasNextPage) {
      setPage((pre) => pre + 1);
    }
  }, [y]);

  // Find out a way to make the scroll works better
  useEffect(() => {
    if (!page) {
      ref.current?.scrollTo(0, ref.current?.scrollHeight);
    }
  }, [renderMessages]);

  let current: string;

  return (
    <Flex direction="column" w="full" h="full">
      <Flex
        justify="space-between"
        align="center"
        border={1}
        borderStyle="solid"
        borderColor="gray.200"
        borderRadius={12}
        padding={2}
        paddingLeft={4}
      >
        <Text fontSize="large" fontWeight={600}>
          {info?.name}
        </Text>
        <ChannelInfoButton />
      </Flex>
      <Box ref={ref} overflowY="auto" flexGrow={1}>
        <Flex justify="center" flexDir="column" gap={1} marginY={2}>
          {isLoading && <CircularProgress isIndeterminate />}
          {nonce === 0 && <Center> Not have any messages yet! </Center>}
          {Object.values(renderMessages)?.map(({ sender, sendAt, content }) => (
            <Flex w="full" direction="column" key={sendAt}>
              {current !== sender.address() && (current = sender.address()) && (
                <>
                  {sender.address() === selectedAccount?.address ? (
                    <Box marginTop={4} />
                  ) : (
                    <Flex
                      margin={2}
                      padding={2}
                      marginTop={4}
                      align="center"
                      gap={2}
                      border={1}
                      borderStyle="solid"
                      borderColor="gray.200"
                      borderRadius={12}
                      w="fit-content"
                    >
                      <Identicon value={current} size={30} theme="polkadot" />
                      <Text fontSize="small" fontWeight={500} color="gray">
                        {shortenAddress(current)}
                      </Text>
                    </Flex>
                  )}
                </>
              )}
              <Tooltip label={`Sent at ${new Date(Number(sendAt)).toString()}`}>
                <Box
                  key={sendAt.toString()}
                  alignSelf={
                    sender.eq(selectedAccount?.address!) ? "end" : "start"
                  }
                  background={
                    sender.eq(selectedAccount?.address!) ? "black" : "gray.100"
                  }
                  maxW="70%"
                  color={
                    sender.eq(selectedAccount?.address!) ? "white" : "black"
                  }
                  padding={2}
                  borderRadius={
                    sender.eq(selectedAccount?.address!)
                      ? "20px 0px 20px 20px"
                      : "0px 20px 20px 20px"
                  }
                  marginX={2}
                  fontSize="small"
                  fontWeight={500}
                >
                  {content}
                </Box>
              </Tooltip>
            </Flex>
          ))}
        </Flex>
      </Box>
      <Flex as="form" onSubmit={handleSendMessage} gap={2}>
        <Input
          value={message}
          onChange={(event) => setMessage(event.target.value)}
        />
        <IconButton
          aria-label="Send message"
          type="submit"
          icon={<ChevronRightIcon fontSize={22} />}
        />
      </Flex>
    </Flex>
  );
}
