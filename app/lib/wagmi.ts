import { http, createConfig } from "wagmi";
import { baseSepolia } from 'wagmi/chains';
import { injected, walletConnect } from 'wagmi/connectors';

export const config = createConfig({
  chains: [baseSepolia],
  connectors: [
    injected(),
    walletConnect({
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
    }),
  ],
  transports: {
    [baseSepolia.id]: http(),
  },
});


export const USDC_CONTRACT = {
  address: '0x323988c410b7944842aFAc86332e9C7CA813aa2C' as `0x${string}`,
  abi: [
    {
      constant: true,
      inputs: [{ name: '_owner', type: 'address' }],
      name: 'balanceOf',
      outputs: [{ name: 'balance', type: 'uint256' }],
      type: 'function',
    },
    {
      constant: false,
      inputs: [
        { name: '_to', type: 'address' },
        { name: '_value', type: 'uint256' },
      ],
      name: 'transfer',
      outputs: [{ name: '', type: 'bool' }],
      type: 'function',
    },
    {
      constant: true,
      inputs: [],
      name: 'decimals',
      outputs: [{ name: '', type: 'uint8' }],
      type: 'function',
    },
  ],
} as const;

export const MERCHANT_WALLET = process.env.NEXT_PUBLIC_MERCHANT_WALLET as `0x${string}`;

export function formatUSDCAmount(amount: number): bigint {
  return BigInt(Math.floor(amount * 1e6));
}

export function parseUSDCAmount(amount: bigint): number {
  return Number(amount) / 1e6;
}

export function validateWalletAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}