import { createPublicClient, http, createWalletClient, encodeFunctionData } from 'viem'
import { hashkey } from 'viem/chains'
import { getContractAddresses } from '@/config/contracts';
import { privateKeyToAccount } from 'viem/accounts';
import { NextResponse } from 'next/server';

// Constants
const BLOCK_THRESHOLD = 200n;
const RPC_URL = "https://mainnet.hsk.xyz"; 
// const RPC_URL = "https://hashkeychain-testnet.alt.technology"; 

// Contract configuration 
const getClients = () => {
  const privateKey = process.env.NEXT_REWARD_UPDATE_PRIVATE_KEY;
  
  if (!privateKey) {
    throw new Error('Private key is not configured in environment variables');
  }
  
  // Create account from private key
  const account = privateKeyToAccount(privateKey as `0x${string}`);
  
  // Create public client
  const publicClient = createPublicClient({
    chain: hashkey,
    transport: http(RPC_URL)
  });
  
  // Create wallet client with the account
  const walletClient = createWalletClient({
    chain: hashkey,
    transport: http(RPC_URL),
    account
  });
  
  return { publicClient, walletClient, account };
};

async function checkAndUpdateRewardPool() {
  try {
    const { publicClient, walletClient, account } = getClients();
    const chainId = hashkey.id;
    const contractAddress = getContractAddresses(chainId).stakingContract;
    
    console.log('Checking if reward pool needs updating...');
    console.log('Using RPC URL:', RPC_URL);
    console.log('Using account address:', account.address);
    
    // Get current block number
    const currentBlock = await publicClient.getBlockNumber();
    console.log('Current block:', currentBlock);
    
    // Get last reward block from contract
    const lastRewardBlock = await publicClient.readContract({
      address: contractAddress,
      abi: [{ 
        name: 'lastRewardBlock', 
        type: 'function', 
        stateMutability: 'view',
        inputs: [], 
        outputs: [{ type: 'uint256' }]
      }],
      functionName: 'lastRewardBlock'
    });
    console.log('Last reward block:', lastRewardBlock);
    
    // Check if update is needed
    if (currentBlock - lastRewardBlock > BLOCK_THRESHOLD) {
      console.log(`Block difference (${currentBlock - lastRewardBlock}) exceeds threshold (${BLOCK_THRESHOLD}). Updating reward pool...`);
      
      try {
        // Get nonce for the account
        const nonce = await publicClient.getTransactionCount({
          address: account.address,
        });
        console.log('Current nonce:', nonce);
        
        // Get gas price
        const gasPrice = await publicClient.getGasPrice();
        console.log('Current gas price:', gasPrice);
        
        // Prepare function data for updateRewardPool
        const data = encodeFunctionData({
          abi: [{ 
            name: 'updateRewardPool', 
            type: 'function', 
            stateMutability: 'nonpayable',
            inputs: [], 
            outputs: []
          }],
          functionName: 'updateRewardPool',
        });
        
        // Estimate gas limit
        const gasLimit = await publicClient.estimateGas({
          account: account.address,
          to: contractAddress,
          data,
        });
        console.log('Estimated gas limit:', gasLimit);
        
        // Prepare and sign transaction manually
        const rawTx = await walletClient.signTransaction({
          account,
          to: contractAddress,
          data,
          gasPrice,
          gas: BigInt(Math.floor(Number(gasLimit) * 1.2)), // Add 20% buffer
          nonce,
          chainId: hashkey.id
        });
        
        console.log('Signed raw transaction');
        
        // Send raw transaction (which is typically allowed even when eth_sendTransaction is not)
        const txHash = await publicClient.sendRawTransaction({
          serializedTransaction: rawTx
        });
        
        console.log('Raw transaction submitted:', txHash);
        
        // Wait for transaction confirmation
        const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
        console.log('Update transaction confirmed:', receipt.transactionHash);
        
        return { 
          success: true, 
          txHash,
          blockNumber: currentBlock.toString(),
          lastRewardBlock: lastRewardBlock.toString(),
          blockDifference: (currentBlock - lastRewardBlock).toString()
        };
      } catch (txError) {
        console.error('Transaction error:', txError);
        return { 
          success: false, 
          error: txError instanceof Error ? txError.message : 'Transaction error',
          details: 'This error may be due to RPC method restrictions. Try using a different RPC endpoint with full access.',
          blockNumber: currentBlock.toString(),
          lastRewardBlock: lastRewardBlock.toString(),
          blockDifference: (currentBlock - lastRewardBlock).toString()
        };
      }
    }
    
    console.log(`Block difference (${currentBlock - lastRewardBlock}) is below threshold (${BLOCK_THRESHOLD}). No update needed.`);
    return { 
      success: false, 
      message: 'No update needed',
      blockNumber: currentBlock.toString(),
      lastRewardBlock: lastRewardBlock.toString(),
      blockDifference: (currentBlock - lastRewardBlock).toString()
    };
  } catch (error) {
    console.error('Error in checkAndUpdateRewardPool:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Next.js App Router API route handler
export async function GET() {
  try {
    const result = await checkAndUpdateRewardPool();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in API handler:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Also support POST requests
export async function POST() {
  return GET();
}

// curl -X POST "https://hashkey-hodlium.vercel.app/api/time"