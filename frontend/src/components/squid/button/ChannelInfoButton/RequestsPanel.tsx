import {
  Button,
  Flex,
  IconButton,
  Stack,
  StackDivider,
  Text,
} from "@chakra-ui/react";
import Identicon from "@polkadot/react-identicon";
import { shortenAddress } from "@/utils/string";
import {
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
} from "@chakra-ui/icons";
import { Approval } from "@/types";
import { useEffect, useState } from "react";
import useContractQuery from "@/hooks/useContractQuery";
import useContract from "@/hooks/useContract";
import { ContractId } from "@/contracts/deployments";
import useContractTx from "@/hooks/useContractTx";
import { useTypink } from "@/providers/TypinkProvider";
import { toast } from "react-toastify";
import useBalance from "@/hooks/useBalance";
import { txToaster } from "@/utils/txToaster";
import { SquidchatContractApi } from "@/contracts/types/squidchat";
import { useChannelContext } from "@/providers/ChannelProvider";

const RECORDS_PER_PAGE = 5;

export default function RequestPanel() {
  const { selectedAccount } = useTypink();
  const { contract } = useContract<SquidchatContractApi>(ContractId.SQUIDCHAT);
  const { selectedChannel, pendingRequestsCount } = useChannelContext();
  const approveRequestTx = useContractTx(contract, "approveRequest");
  const balance = useBalance(selectedAccount?.address);
  const [approvals, setApprovals] = useState<Record<string, boolean>>({});
  const [page, setPage] = useState(0);

  const { data: pendingRequests, refresh } = useContractQuery({
    contract,
    fn: "listPendingRequests",
    args: [selectedChannel!, page * RECORDS_PER_PAGE, RECORDS_PER_PAGE],
  });

  const handleSubmitApproval = async () => {
    if (!contract || !approvals) return;

    if (!selectedAccount) {
      toast.info("Please connect to your wallet");
      return;
    }

    if (balance === 0n) {
      toast.error("Balance insufficient to make transaction.");
      return;
    }

    const toaster = txToaster("Signing transaction...");

    const approvalValues = Object.entries(approvals);

    try {
      await approveRequestTx.signAndSend({
        args: [selectedChannel!, approvalValues!],
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
      setApprovals({});
    }
  };

  const handleSelect = (approval: Approval) => {
    setApprovals((prevState) => {
      if (approvals[approval[0]] !== undefined) {
        const newOne = { ...prevState };
        if (approval[1] === approvals[approval[0]]) {
          delete newOne[approval[0]];

          return newOne;
        }

        newOne[approval[0]] = approval[1];

        return newOne;
      }

      return { ...prevState, [approval[0]]: approval[1] };
    });
  };

  // Keep-up with realtime updates
  useEffect(() => {
    refresh();
  }, [pendingRequestsCount]);

  const { items, hasNextPage, total } = pendingRequests || {};

  return (
    <Flex direction="column" gap={4} minH="25rem">
      <Text
        fontSize="large"
        fontWeight={600}
      >{`Pending Requests (${total})`}</Text>
      <Stack direction="column" divider={<StackDivider />} flex={1}>
        {items?.map(({ sender }) => (
          <Flex
            key={sender.address()}
            align="center"
            gap={4}
            justify="space-between"
          >
            <Flex key={sender.address()} align="center" gap={4}>
              <Identicon value={sender.address()} size={40} theme="polkadot" />
              <Text fontWeight={500}>{shortenAddress(sender.address())}</Text>
            </Flex>
            <Flex gap={2}>
              <IconButton
                aria-label="Accept"
                onClick={() => handleSelect([sender.address(), true])}
                colorScheme={
                  approvals[sender.address()] !== undefined &&
                  approvals[sender.address()]
                    ? "green"
                    : "gray"
                }
                icon={<CheckIcon />}
                isRound
              />
              <IconButton
                aria-label="Refuse"
                onClick={() => handleSelect([sender.address(), false])}
                colorScheme={
                  approvals[sender.address()] !== undefined &&
                  !approvals[sender.address()]
                    ? "red"
                    : "gray"
                }
                icon={<CloseIcon />}
                isRound
              />
            </Flex>
          </Flex>
        ))}
      </Stack>
      <Flex gap={4} justify="space-between" w="full">
        <Button
          isDisabled={!Object.keys(approvals).length}
          onClick={handleSubmitApproval}
          visibility={!Object.keys(approvals).length ? "hidden" : "visible"}
        >
          Approve
        </Button>
        <Flex gap={2}>
          <IconButton
            aria-label="Back"
            icon={<ChevronLeftIcon />}
            onClick={() => setPage((prev) => prev - 1)}
            isDisabled={page === 0}
          />
          <IconButton
            aria-label="Forward"
            icon={<ChevronRightIcon />}
            onClick={() => setPage((prev) => prev - 1)}
            isDisabled={!hasNextPage}
          />
        </Flex>
      </Flex>
    </Flex>
  );
}
