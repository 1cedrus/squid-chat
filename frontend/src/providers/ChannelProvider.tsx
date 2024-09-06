import { createContext, useContext } from "react";
import { Props } from "@/types";
import {
  SquidchatChannel,
  SquidchatContractApi,
} from "@/contracts/types/squidchat";
import { useTypink } from "./TypinkProvider";
import { AccountId32 } from "dedot/codecs";
import useContractQuery from "@/hooks/useContractQuery";
import useContract from "@/hooks/useContract";
import { ContractId } from "@/contracts/deployments";
import { useAsync } from "react-use";

export interface ChannelContextProps {
  info?: SquidchatChannel;
  members?: AccountId32[];
  pendingRequestsCount?: number;
  messageNonce?: number;
  selectedChannel?: number;
  isOwner?: boolean;
}

export const ChannelContext = createContext<ChannelContextProps>({});

export const useChannelContext = () => {
  return useContext(ChannelContext);
};

interface ChannelProviderProps extends Props {
  selectedChannel: number;
}

// Make sure selectedAccount and selectedChannel are not undefined
export default function ChannelProvider({
  children,
  selectedChannel,
}: ChannelProviderProps) {
  const { selectedAccount, client } = useTypink();
  const { contract } = useContract<SquidchatContractApi>(ContractId.SQUIDCHAT);

  const { data: info, refresh: rfInfo } = useContractQuery({
    contract,
    fn: "getChannelInfo",
    args: [selectedChannel],
  });

  const { data: channelMembers, refresh: rfMembers } = useContractQuery({
    contract,
    fn: "getChannelMembers",
    args: [selectedChannel],
  });

  const { data: pendingRequestsCount, refresh: rfPendingRequestsCount } =
    useContractQuery({
      contract,
      fn: "pendingRequestsCount",
      args: [selectedChannel],
    });

  const { data: messageNonce } = useContractQuery({
    contract,
    fn: "messageCount",
    args: [selectedChannel],
  });

  useAsync(async () => {
    if (!selectedAccount || !contract || !client) return;

    const unsub = await client.query.system.events((events) => {
      const updatedEvents = contract.events.ChannelUpdated.filter(events);

      updatedEvents.forEach(({ data: { channelId } }) => {
        if (channelId !== selectedChannel) return;

        rfInfo();
      });

      const approvalSubmittedEvents =
        contract.events.ApprovalSubmitted.filter(events);

      approvalSubmittedEvents.forEach(({ data: { channelId } }) => {
        if (channelId !== selectedChannel) return;

        rfPendingRequestsCount();
        rfMembers();
      });

      const requestSentEvents = contract.events.RequestSent.filter(events);

      requestSentEvents.forEach(({ data: { channelId } }) => {
        if (channelId !== selectedChannel) return;

        rfPendingRequestsCount();
      });

      const requestCancelledEvents =
        contract.events.RequestCancelled.filter(events);

      requestCancelledEvents.forEach(({ data: { channelId } }) => {
        if (channelId !== selectedChannel) return;

        rfPendingRequestsCount();
      });
    });

    return () => {
      unsub();
    };
  }, [client, contract, selectedAccount, selectedChannel]);

  const isOwner =
    info?.isOk && info.value.owner.address() === selectedAccount?.address;

  return (
    <ChannelContext.Provider
      value={{
        info: info?.isOk ? info.value : undefined,
        members: channelMembers?.isOk ? channelMembers.value : undefined,
        pendingRequestsCount: pendingRequestsCount?.isOk
          ? pendingRequestsCount.value
          : undefined,
        messageNonce: messageNonce?.isOk ? messageNonce.value : undefined,
        selectedChannel,
        isOwner,
      }}
    >
      {children}
    </ChannelContext.Provider>
  );
}
