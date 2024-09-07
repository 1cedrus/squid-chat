import { createContext, useContext, useEffect, useState } from "react";
import { Props } from "@/types";
import useContractQuery from "@/hooks/useContractQuery";
import useContract from "@/hooks/useContract";
import {
  SquidchatChannelRecord,
  SquidchatContractApi,
} from "@/contracts/types/squidchat";
import { ContractId } from "@/contracts/deployments";
import { useTypink } from "./TypinkProvider";
import { useAsync } from "react-use";

export interface SquidContextProps {
  selectedChannel?: number;
  setSelectedChannel: (channel: number) => void;
  selectedAccountChannels?: SquidchatChannelRecord[];
  rfSelectedAccountChannels?: () => void;
  isLoading?: boolean;
}

export const SquidContext = createContext<SquidContextProps>({
  setSelectedChannel: () => {},
});

export const useSquidContext = () => {
  return useContext(SquidContext);
};

export default function SquidProvider({ children }: Props) {
  const { selectedAccount, client } = useTypink();
  const [selectedChannel, setSelectedChannel] = useState<number>();
  const { contract } = useContract<SquidchatContractApi>(ContractId.SQUIDCHAT);

  const { data: selectedAccountChannels, refresh: rfSelectedAccountChannels, isLoading } =
    useContractQuery({
      contract,
      fn: "getMemberChannels",
      args: [selectedAccount!.address],
    });

  useAsync(async () => {
    if (!selectedAccount || !contract || !client) return;

    const unsub = await client.query.system.events((events) => {
      const channelCreatedEvents =
        contract.events.ChannelCreated.filter(events);

      if (!channelCreatedEvents.length) return;

      channelCreatedEvents.forEach(({ data: { owner } }) => {
        owner.address() === selectedAccount.address &&
          rfSelectedAccountChannels();
      });

      const submittedApprovalEvents =
        contract.events.ApprovalSubmitted.filter(events);

      if (!submittedApprovalEvents.length) return;

      // TODO! We should only refresh the channels that the selectedAccount have pending requests
      submittedApprovalEvents.forEach(() => rfSelectedAccountChannels());
    });

    return () => {
      unsub();
    };
  }, [client, contract, selectedAccount]);

  useEffect(() => {
    if (!selectedAccountChannels?.length) return;

    setSelectedChannel(selectedAccountChannels[0].channelId);

    return () => {
      setSelectedChannel(undefined);
    };
  }, [selectedAccount, selectedAccountChannels]);

  return (
    <SquidContext.Provider
      value={{
        setSelectedChannel,
        selectedChannel,
        selectedAccountChannels,
        rfSelectedAccountChannels,
        isLoading
      }}
    >
      {children}
    </SquidContext.Provider>
  );
}
