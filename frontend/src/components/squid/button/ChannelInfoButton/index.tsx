import { InfoIcon } from "@chakra-ui/icons";
import {
  IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Tabs,
  TabList,
  TabPanels,
  TabPanel,
  Tab,
} from "@chakra-ui/react";
import OverviewPanel from "./OverviewPanel";
import MembersPanel from "./MembersPanel";
import RequestsPanel from "./RequestsPanel";
import useContract from "@/hooks/useContract";
import { SquidchatContractApi } from "@/contracts/types/squidchat";
import { ContractId } from "@/contracts/deployments";
import useContractTx from "@/hooks/useContractTx";
import { useTypink } from "@/providers/TypinkProvider";
import useBalance from "@/hooks/useBalance";
import { toast } from "react-toastify";
import { txToaster } from "@/utils/txToaster";
import { useSquidContext } from "@/providers/SquidProvider";
import { useChannelContext } from "@/providers/ChannelProvider";

export default function ChannelInfoButton() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { selectedAccount } = useTypink();
  const { selectedChannel, rfSelectedAccountChannels } = useSquidContext();
  const { isOwner } = useChannelContext();
  const { contract } = useContract<SquidchatContractApi>(ContractId.SQUIDCHAT);
  const leaveChannelTx = useContractTx(contract, "leaveChannel");
  const balance = useBalance(selectedAccount?.address);

  const handleLeaveChannel = async () => {
    if (!contract) return;

    if (balance === 0n) {
      toast.error("Balance insufficient to make transaction.");
      return;
    }

    const toaster = txToaster("Signing transaction...");

    try {
      await leaveChannelTx.signAndSend({
        args: [selectedChannel!],
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
      rfSelectedAccountChannels!();
    }
  };

  return (
    <>
      <IconButton
        aria-label="Info about channel"
        icon={<InfoIcon />}
        variant="outline"
        borderRadius={10}
        onClick={onOpen}
      />
      <Modal isOpen={isOpen} onClose={onClose} size="2xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader />
          <ModalCloseButton />
          <ModalBody>
            <Tabs
              orientation="vertical"
              variant="soft-rounded"
              colorScheme="gray"
            >
              <TabList gap={1} whiteSpace="nowrap">
                <Tab>🔥 Overview</Tab>
                <Tab>🐶 Members</Tab>
                <Tab>👍 Requests</Tab>
                <Tab
                  color="red"
                  onClick={handleLeaveChannel}
                  isDisabled={isOwner}
                >
                  Leave Channel
                </Tab>
              </TabList>

              <TabPanels
                borderLeft={1}
                borderStyle="solid"
                borderColor="gray.200"
                marginLeft={4}
              >
                <TabPanel paddingY={0}>
                  <OverviewPanel />
                </TabPanel>
                <TabPanel paddingY={0}>
                  <MembersPanel />
                </TabPanel>
                <TabPanel paddingY={0}>
                  <RequestsPanel />
                </TabPanel>
              </TabPanels>
            </Tabs>
          </ModalBody>
          <ModalFooter />
        </ModalContent>
      </Modal>
    </>
  );
}
