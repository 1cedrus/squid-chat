import { ContractId } from "@/contracts/deployments";
import { SquidchatContractApi } from "@/contracts/types/squidchat";
import useBalance from "@/hooks/useBalance";
import useContract from "@/hooks/useContract";
import useContractTx from "@/hooks/useContractTx";
import { useChannelContext } from "@/providers/ChannelProvider";
import { useTypink } from "@/providers/TypinkProvider";
import { txToaster } from "@/utils/txToaster";
import {
  Flex,
  Avatar,
  Center,
  Text,
  Button,
  useDisclosure,
  Fade,
  FormControl,
  FormLabel,
  Input,
} from "@chakra-ui/react";
import { useState } from "react";
import { toast } from "react-toastify";

export default function OverviewPanel() {
  const { isOwner, info } = useChannelContext();
  const { isOpen, onToggle } = useDisclosure();
  const [name, setName] = useState("");
  const [imgUrl, setImgUrl] = useState<string | undefined>("");
  const { contract } = useContract<SquidchatContractApi>(ContractId.SQUIDCHAT);
  const { selectedChannel } = useChannelContext();
  const { selectedAccount } = useTypink();
  const updateChannelTx = useContractTx(contract, "updateChannel");
  const balance = useBalance(selectedAccount?.address);

  const handleToggle = () => {
    if (!isOpen) {
      setName(info!.name);
      setImgUrl(info?.imgUrl);
    } else {
      setName("");
      setImgUrl("");
    }

    onToggle();
  };

  const handleUpdateInfo = async () => {
    if (!contract || !name) return;

    if (balance === 0n) {
      toast.error("Balance insufficient to make transaction.");
      return;
    }

    const toaster = txToaster("Signing transaction...");

    try {
      await updateChannelTx.signAndSend({
        args: [selectedChannel!, name, imgUrl],
        callback: ({ status }) => {
          console.log(status);

          toaster.updateTxStatus(status);
        },
      });
    } catch (e: any) {
      console.error(e, e.message);
      toaster.onError(e);
    } finally {
      handleToggle();
    }
  };

  return (
    <Flex direction="column" align="center" minH="25rem" gap={4}>
      <Flex direction="column" gap={4} align="center">
        <Avatar
          name={name || info?.name}
          src={imgUrl || info?.imgUrl}
          size="2xl"
        />
        <Center>
          <Text fontSize="xl" fontWeight={600}>
            {name || info?.name}
          </Text>
        </Center>
      </Flex>
      <Flex w="full" direction="column" gap={4} flex={1}>
        <Fade in={isOpen}>
          <Flex direction="column" gap={4} flex={1}>
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
        </Fade>
        <Flex justify="space-between" mt={4}>
          <Button
            onClick={handleUpdateInfo}
            visibility={isOpen ? "visible" : "hidden"}
          >
            Save
          </Button>
          <Button
            variant="outline"
            isDisabled={!isOwner}
            onClick={handleToggle}
          >
            {isOpen ? "Back" : "Update Info"}
          </Button>
        </Flex>
      </Flex>
    </Flex>
  );
}
