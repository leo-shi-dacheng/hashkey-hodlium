export const contractAddresses = {
    133: {
      stakingContract: '0x8F29450fa31e04991E1e104C517B01eFc5c303cf' as `0x${string}`,
      stakingNewContract: '0x6883534bf8FCFb4DDE388005d8A817b4193Bcd6a' as `0x${string}`,
      stHSKToken: '0x' as `0x${string}`,
    },
    177: {
      stakingContract: '0x56E45F362cf4Bbfb5a99e631eF177f2907146483' as `0x${string}`,
      stakingNewContract: '' as `0x${string}`,
      stHSKToken: '0x' as `0x${string}`,
    },
  };
  
  // 根据环境变量确定默认链ID
  export const defaultChainId = 177
  
  export const getContractAddresses = (chainId: number) => {
    return contractAddresses[chainId as keyof typeof contractAddresses] || 
      contractAddresses[defaultChainId];
  };