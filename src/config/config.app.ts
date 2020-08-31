import Web3 from 'web3';

export interface ApplicationConfig {
  port: number;
  ethereumColdKey: string;
  ethereumSignKey: string;
  web3Provider: string;
  web3BatchSize: number;
  ethereumBlockCheckTime: number;
  ethereumBlockTryCheckNumber: number;
  ethereumRequiredConfirmations: number;
  ethereumUSDTAddress: string;
  bitsharesSignKey: string;
  bitsharesMemoKey: string;
  bitsharesProvider: string;
  bitsharesConnectionTimeout: number;
  bithsaresBlockCheckTime: number;
  bithsaresBlockTryCheckNumber: number;
  bitsharesAssetFee: string;
}

export const developmentConfig: ApplicationConfig = {
  port: process.env.PORT ?? 8080,
  // Ethereum cold wallet public key
  // Test key for example, dont use in production
  ethereumColdKey:
    process.env.ETHEREUM_COLD_KEY ??
    'xpub6FnCn6nSzZAw5Tw7cgR9bi15UV96gLZhjDstkXXxvCLsUXBGXPdSnLFbdpq8p9HmGsAp' +
      'ME5hQTZ3emM2rnY5agb9rXpVGyy3bdW6EEgAtqt',
  // Ethereum hot wallet private key
  // Test key for example, dont use in production
  ethereumSignKey:
    process.env.ETHEREUM_SIGN_KEY ??
    '0x4d16897645794143776a79a61b4200b15c2201e561227be9db62ae12187b01b7',
  // Ethereum node
  web3Provider:
    (process.env.WEB3_PROVIDER ?? Web3.givenProvider) ||
    'wss://main-rpc.linkpool.io/ws',
  web3BatchSize: process.env.WEB3_BATCH_SIZE ?? 1000,
  ethereumBlockCheckTime: process.env.ETHEREUM_BLOCK_CHECK_TIME ?? 30000,
  ethereumBlockTryCheckNumber:
    process.env.ETHEREUM_BLOCK_TRY_CHECK_NUMBER ?? 20,
  ethereumRequiredConfirmations:
    process.env.ETHEREUM_REQUIRED_CONFIRMATIONS ?? 24,
  ethereumUSDTAddress:
    process.env.ETHEREUM_USDT_ADDRESS ??
    '0xdac17f958d2ee523a2206206994597c13d831ec7',
};

export interface ApplicationConfigs {
  [key: string]: ApplicationConfig;
}

export const applicationConfigs: ApplicationConfigs = {
  development: developmentConfig,
};
