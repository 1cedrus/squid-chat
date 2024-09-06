import { ContractId } from "@/contracts/deployments";
import useBalance from "@/hooks/useBalance";
import useContract from "@/hooks/useContract";
import useContractTx from "@/hooks/useContractTx";
import { useTypink } from "@/providers/TypinkProvider";
import { txToaster } from "@/utils/txToaster";
import { AddIcon, ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons";
import {
  Flex,
  Text,
  Button,
  IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Input,
  Avatar,
  FormControl,
  FormLabel,
  Center,
  Box,
  Stack,
  StackDivider,
} from "@chakra-ui/react";
import { useState } from "react";
import { toast } from "react-toastify";
import { useSquidContext } from "@/providers/SquidProvider";
import useContractQuery from "@/hooks/useContractQuery";
import { shortenAddress } from "@/utils/string";
import { SquidchatContractApi } from "@/contracts/types/squidchat";

enum Method {
  Create = "Create a new channel",
  Join = "Join an existing channel",
}

export default function AddChannelButton() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { selectedAccountChannels, setSelectedChannel } = useSquidContext();
  const { selectedAccount } = useTypink();
  const { contract } = useContract<SquidchatContractApi>(ContractId.SQUIDCHAT);
  const balance = useBalance(selectedAccount?.address);
  const newChannelTx = useContractTx(contract, "newChannel");
  const sendRequestTx = useContractTx(contract, "sendRequest");
  const cancelRequestTx = useContractTx(contract, "cancelRequest");
  const [name, setName] = useState("");
  const [imgUrl, setImgUrl] = useState<string | undefined>();
  const [method, setMethod] = useState<Method>();
  const [page, setPage] = useState(0);

  const { data: channels } = useContractQuery({
    contract,
    fn: "listChannels",
    args: [page * 5, 5],
  });

  const { items, hasNextPage, total } = channels || {};

  const { data: pendingRequestFor, refresh } = useContractQuery({
    contract,
    fn: "pendingRequestFor",
    args: [
      selectedAccount?.address,
      items?.map(({ channelId }) => channelId) || [],
    ],
  });

  const handleRequest = async (channelId: number) => {
    if (!contract) return;

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
      await sendRequestTx.signAndSend({
        args: [channelId],
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
    }
  };

  const handleCancelRequest = async (channelId: number) => {
    if (!contract) return;

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
      await cancelRequestTx.signAndSend({
        args: [channelId],
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
    }
  };

  const handleCreateChannel = async () => {
    if (!contract || !name) return;

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
      await newChannelTx.signAndSend({
        args: [name, imgUrl],
        callback: ({ status }) => {
          console.log(status);

          toaster.updateTxStatus(status);
        },
      });
    } catch (e: any) {
      console.error(e, e.message);
      toaster.onError(e);
    } finally {
      onClose();
      setMethod(undefined);
      setName("");
      setImgUrl(undefined);
    }
  };

  const handleClose = () => {
    setMethod(undefined);
    onClose();
  };

  if (method === Method.Join && !channels) {
    return null;
  }

  return (
    <>
      <IconButton
        aria-label="Create a new channel"
        size="lg"
        isRound
        _hover={{
          borderRadius: 10,
        }}
        icon={<AddIcon fontSize={16} />}
        onClick={onOpen}
      />
      <Modal isOpen={isOpen} onClose={handleClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {!method && "Add Channel"}
            {method === Method.Create && "Create New Channel"}
            {method === Method.Join && `Join Existing Channel (${total})`}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {!method && (
              <Flex gap={2} h={180}>
                <Button
                  onClick={() => setMethod(Method.Create)}
                  flex={1}
                  variant="outline"
                  h="full"
                >
                  <Text fontSize="large" fontWeight={600}>
                    Create 🔥
                  </Text>
                </Button>
                <Button
                  onClick={() => setMethod(Method.Join)}
                  flex={1}
                  variant="outline"
                  h="full"
                >
                  <Text fontSize="large" fontWeight={600}>
                    Join 😎
                  </Text>
                </Button>
              </Flex>
            )}
            {method === Method.Create && (
              <Flex direction="column" gap={4}>
                <Center>
                  <Avatar name={name} src={imgUrl} size="2xl" />
                </Center>
                <FormControl>
                  <FormLabel>Channel name:</FormLabel>
                  <Input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Logo url:</FormLabel>
                  <Input
                    value={imgUrl}
                    onChange={(event) => setImgUrl(event.target.value)}
                  />
                </FormControl>
              </Flex>
            )}
            {method === Method.Join && (
              <Stack direction="column" divider={<StackDivider />}>
                {items?.map(
                  ({ channelId, channel: { name, imgUrl, owner } }) => (
                    <Flex
                      key={channelId}
                      gap={2}
                      align="center"
                      justify="space-between"
                      w="full"
                    >
                      <Flex gap={2}>
                        <Avatar name={name} src={imgUrl} />
                        <Box>
                          <Text fontSize="large" fontWeight={600}>
                            {name}
                          </Text>
                          <Text>{shortenAddress(owner.address())}</Text>
                        </Box>
                      </Flex>
                      {selectedAccountChannels?.find(
                        (one) => one.channelId === channelId
                      ) ? (
                        <Button
                          onClick={() => {
                            setSelectedChannel(channelId);
                            handleClose();
                          }}
                          size="sm"
                          variant="outline"
                        >
                          View
                        </Button>
                      ) : pendingRequestFor?.find(
                          (one) => one.channelId === channelId
                        ) ? (
                        <Button
                          onClick={() => handleCancelRequest(channelId)}
                          size="sm"
                          variant="outline"
                        >
                          Cannel Request
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleRequest(channelId)}
                          size="sm"
                          variant="outline"
                        >
                          Request
                        </Button>
                      )}
                    </Flex>
                  )
                )}
              </Stack>
            )}
          </ModalBody>
          <ModalFooter>
            {method === Method.Create && (
              <Flex justify="space-between" w="full">
                <Button variant="ghost" onClick={() => setMethod(undefined)}>
                  Back
                </Button>
                <Button colorScheme="gray" onClick={handleCreateChannel}>
                  Create
                </Button>
              </Flex>
            )}
            {method === Method.Join && (
              <Flex justify="space-between" w="full">
                <Button variant="ghost" onClick={() => setMethod(undefined)}>
                  Back
                </Button>
                <Flex gap={2}>
                  <IconButton
                    aria-label="Back"
                    onClick={() => setPage((prev) => prev - 1)}
                    isDisabled={!page}
                    icon={<ChevronLeftIcon />}
                  />
                  <IconButton
                    aria-label="Forward"
                    onClick={() => setPage((prev) => prev + 1)}
                    isDisabled={!hasNextPage}
                    icon={<ChevronRightIcon />}
                  />
                </Flex>
              </Flex>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
