import greeterMetadata from '@/contracts/greeter/greeter.json';
import psp22Metadata from '@/contracts/psp22/psp22.json';
import squidChatMetadata from '@/contracts/squidchat/squidchat.json';
import { ContractDeployment } from '@/types.ts';
import { NetworkId } from '@/utils/networks.ts';

export enum ContractId {
  GREETER = 'greeter',
  PSP22 = 'psp22',
  SQUIDCHAT = 'squidchat',
}

export const squidChatDeployments: ContractDeployment[] = [
  {
    id: ContractId.SQUIDCHAT,
    metadata: squidChatMetadata as any,
    network: NetworkId.DEVELOPMENT,
    address: '5Euwy4dtPtgq3XkqSYT5Z3SyCiJPKsApCcUfsHyaN8CZWH4E',
  },
  {
    id: ContractId.SQUIDCHAT,
    metadata: squidChatMetadata as any,
    network: NetworkId.POP_TESTNET,
    address: '13uEYiYAnCKDp7S1A99Gc1iaipXAB6D3rzdn7gwQ5fCJenfc',
  },
  {
    id: ContractId.SQUIDCHAT,
    metadata: squidChatMetadata as any,
    network: NetworkId.ALEPHZERO_TESTNET,
    address: '5HFkbGoUUVLfgFRq5zZMJdPb8cF78GL3qP5vGXGHqLc9keoQ',
  },
];

export const greeterDeployments: ContractDeployment[] = [
  {
    id: ContractId.GREETER,
    metadata: greeterMetadata as any,
    network: NetworkId.POP_TESTNET,
    address: '5HJ2XLhBuoLkoJT5G2MfMWVpsybUtcqRGWe29Fo26JVvDCZG',
  },
  {
    id: ContractId.GREETER,
    metadata: greeterMetadata as any,
    network: NetworkId.ALEPHZERO_TESTNET,
    address: '5CDia8Y46K7CbD2vLej2SjrvxpfcbrLVqK2He3pTJod2Eyik',
  },
];

export const psp22Deployments: ContractDeployment[] = [
  {
    id: ContractId.PSP22,
    metadata: psp22Metadata as any,
    network: NetworkId.POP_TESTNET,
    address: '5GSGWox1ZxUkHBAEbm6NPAHLKD28VoQefTRBYTQuydLrxaKJ',
  },
  {
    id: ContractId.PSP22,
    metadata: psp22Metadata as any,
    network: NetworkId.ALEPHZERO_TESTNET,
    address: '5G5moUCkx5E2TD3CcRWvweg7rpCLngRmwukuKdaohvfBBmXr',
  },
];

export const deployments = [...squidChatDeployments ,...greeterDeployments, ...psp22Deployments];
