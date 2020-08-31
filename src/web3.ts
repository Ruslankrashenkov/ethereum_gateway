import { EventEmitter } from 'events';

import { Job } from 'bullmq';
import { Decimal } from 'decimal.js';
import { Op as SequelizeOp, Transaction } from 'sequelize';
import Web3 from 'web3';
import { EventLog, PromiEvent, TransactionReceipt } from 'web3-core';
import { Contract, ContractOptions, EventData } from 'web3-eth-contract';
import { AbiType, StateMutabilityType } from 'web3-utils';

import { appConfig } from './app';
import {
  DerivedWallets as DerivedWalletsModel,
  Transactions as TransactionsModel,
  TransactionsCommitPrefix as TransactionsModelCommitPrefix,
  TransactionsStatus as TransactionsModelStatus,
  TransactionsStatusInitial as TransactionsModelStatusInitial,
  TransactionsTx as TransactionsModelTx,
  Wallets as WalletsModel,
  sequelize,
} from './models';
import { TaskStatus, inspect, range, resolveAny, toCamelCase } from './utils';

export class TrNotFound extends Error {}

export class TrDeriveWalletNotFound extends Error {}

export class TrDeriveWalletInvoiceNotFound extends Error {}

export class TrAmountFromNotFound extends Error {}

export class UnknownTicker extends Error {}

export class UnknownTickerFrom extends UnknownTicker {}

export class UnknownTickerTo extends UnknownTicker {}

export class TransferEventDeclDoesntExist extends Error {}

export interface Tx {
  nonce?: string | number;
  chainId?: string | number;
  from?: string;
  to?: string;
  data?: string;
  value?: string | number;
  gas?: string | number;
  gasPrice?: string | number;
}

export interface TxObject<T> {
  arguments: any[];
  call: (tx?: Tx) => Promise<T>;
  send: (tx?: Tx) => PromiEvent<T>;
  estimateGas: (tx?: Tx) => Promise<number>;
  encodeABI: () => string;
}

export interface EventOptions {
  filter?: object;
  fromBlock?: 'latest' | 'pending' | 'genesis' | number;
  topics?: string[];
}

export interface CallbackEvent<T> {
  (error: Error, result: T): void;
}

export interface ContractEventLog<T> extends EventLog {
  returnValues: T;
}

export interface ContractEventOn<E, T> {
  (event: 'connected', listener: (subscriptionId: string) => void): E;
  (
    event: 'data' | 'changed',
    listener: (event: ContractEventLog<T>) => void
  ): this;
  (event: 'error', listener: (error: Error) => void): E;
}

export interface ContractEventEmitter<T> extends EventEmitter {
  on: ContractEventOn<this, T>;
}

export interface ContractEvent<T> {
  (
    options?: EventOptions,
    cb?: CallbackEvent<ContractEventLog<T>>
  ): ContractEventEmitter<T>;
}

export interface TransferEvent {
  from: string;
  to: string;
  amount: string;
  0: string;
  1: string;
  2: string;
}

export interface ApprovalEvent {
  owner: string;
  spender: string;
  value: string;
  0: string;
  1: string;
  2: string;
}

export class ERC20Contract extends Contract {
  public methods: {
    name: () => TxObject<string>;

    symbol: () => TxObject<string>;

    decimals: () => TxObject<string>;

    totalSupply: () => TxObject<string>;

    balanceOf: (owner: string) => TxObject<string>;

    transfer: (to: string, amount: number | string) => TxObject<void>;

    transferFrom: (
      from: string,
      to: string,
      amount: number | string
    ) => TxObject<void>;

    approve: (spender: string, amount: number | string) => TxObject<void>;

    allowance: (owner: string, spender: string) => TxObject<string>;
  };

  public events: {
    Transfer: ContractEvent<TransferEvent>;
    Approval: ContractEvent<ApprovalEvent>;
    allEvents: (
      options?: EventOptions,
      cb?: CallbackEvent<EventLog>
    ) => EventEmitter;
  };

  public constructor(
    jsonInterface: any[],
    address?: string,
    options?: ContractOptions
  );

  public clone(): this;
}

export const erc20Abi = [
  {
    constant: true,
    inputs: [],
    name: 'name',
    outputs: [
      {
        name: 'name',
        type: 'string',
      },
    ],
    payable: false,
    stateMutability: 'view' as StateMutabilityType,
    type: 'function' as AbiType,
  },
  {
    constant: true,
    inputs: [],
    name: 'symbol',
    outputs: [
      {
        name: 'symbol',
        type: 'string',
      },
    ],
    payable: false,
    stateMutability: 'view' as StateMutabilityType,
    type: 'function' as AbiType,
  },
  {
    constant: true,
    inputs: [],
    name: 'decimals',
    outputs: [
      {
        name: 'decimals',
        type: 'uint256',
      },
    ],
    payable: false,
    stateMutability: 'view' as StateMutabilityType,
    type: 'function' as AbiType,
  },
  {
    constant: true,
    inputs: [],
    name: 'totalSupply',
    outputs: [
      {
        name: 'totalSupply',
        type: 'uint256',
      },
    ],
    payable: false,
    stateMutability: 'view' as StateMutabilityType,
    type: 'function' as AbiType,
  },
  {
    constant: true,
    inputs: [
      {
        name: 'owner',
        type: 'address',
      },
    ],
    name: 'balanceOf',
    outputs: [
      {
        name: 'balance',
        type: 'uint256',
      },
    ],
    payable: false,
    stateMutability: 'view' as StateMutabilityType,
    type: 'function' as AbiType,
  },
  {
    constant: false,
    inputs: [
      {
        name: 'to',
        type: 'address',
      },
      {
        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'transfer',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable' as StateMutabilityType,
    type: 'function' as AbiType,
  },
  {
    constant: false,
    inputs: [
      {
        name: 'from',
        type: 'address',
      },
      {
        name: 'to',
        type: 'address',
      },
      {
        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'transferFrom',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable' as StateMutabilityType,
    type: 'function' as AbiType,
  },
  {
    constant: false,
    inputs: [
      {
        name: 'spender',
        type: 'address',
      },
      {
        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'approve',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable' as StateMutabilityType,
    type: 'function' as AbiType,
  },
  {
    constant: true,
    inputs: [
      {
        name: 'owner',
        type: 'address',
      },
      {
        name: 'spender',
        type: 'address',
      },
    ],
    name: 'allowance',
    outputs: [
      {
        name: 'remaining',
        type: 'uint256',
      },
    ],
    payable: false,
    stateMutability: 'view' as StateMutabilityType,
    type: 'function' as AbiType,
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        name: 'from',
        type: 'address',
      },
      {
        indexed: true,
        name: 'to',
        type: 'address',
      },
      {
        indexed: false,
        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'Transfer',
    type: 'event' as AbiType,
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        name: 'owner',
        type: 'address',
      },
      {
        indexed: true,
        name: 'spender',
        type: 'address',
      },
      {
        indexed: false,
        name: 'value',
        type: 'uint256',
      },
    ],
    name: 'Approval',
    type: 'event' as AbiType,
  },
];

export interface ERC20Contracts {
  [key: string]: ERC20Contract;
}

const web3 = new Web3(appConfig.web3Provider);

export const erc20Contracts: ERC20Contracts = {
  // https://api.etherscan.io/api?module=contract&action=getsourcecode&address=
  USDT: new web3.eth.Contract(erc20Abi, appConfig.ethereumUSDTAddress),
};

export async function txTransferTo(
  _job: Job,
  tr: TransactionsModel,
  previousStatus: TransactionsModelStatusInitial,
  commitPrefix: TransactionsModelCommitPrefix
): Promise<TransactionsModelTxRaw> {
  if (typeof tr.derivedWallet === 'undefined') {
    throw new TrDeriveWalletNotFound();
  }

  if (tr.derivedWallet.invoice === null) {
    throw new TrDeriveWalletInvoiceNotFound();
  }

  if (typeof tr.amountFrom === 'undefined' || tr.amountFrom === null) {
    throw new TrAmountFromNotFound();
  }

  let txPrefix = toCamelCase(commitPrefix);

  txPrefix = `tx${txPrefix.charAt(0).toUpperCase()}${txPrefix.substring(1)}`;

  const txCreatedAtPrefix = `${txPrefix}CreatedAt`;
  const okStatus = `${commitPrefix}_commit_ok` as TransactionsModelStatus;
  const errorStatus = `${commitPrefix}_commit_err` as TransactionsModelStatus;
  let tx: TransactionsModelTxRaw;

  if (tr.status === previousStatus || tr.status === errorStatus) {
    if (tr.tickerFrom !== 'FINTEH.USDT') {
      throw new UnknownTickerFrom();
    }

    if (tr.tickerTo !== 'USDT') {
      throw new UnknownTickerTo();
    }

    const erc20Contract = erc20Contracts[tr.tickerTo];
    const assetDecimals = new Decimal(
      await erc20Contract.methods.decimals().call()
    );
    const amountTo = Decimal.mul(
      tr.amountFrom,
      Decimal.pow(10, assetDecimals)
    ).toString();
    const callData = erc20Contract.methods.transfer(
      tr.derivedWallet.invoice,
      amountTo
    );
    tx = await web3.eth.accounts.signTransaction(
      {
        to: erc20Contract._address,
        gas: (await callData.estimateGas()) * 4,
        data: callData.encodeABI(),
      },
      appConfig.ethereumSignKey
    );

    await sequelize.transaction(async (transaction: Transaction) => {
      const txCommited: TransactionsModelTx = tr[txPrefix] ?? {};

      if (tx[txCreatedAtPrefix] === null) {
        tx[txCreatedAtPrefix] = new Date();
      }

      if (typeof txCommited.tx === 'undefined' || txCommited.tx === null) {
        txCommited.tx = tx;
        txCommited.txId = tx.transactionHash;
        tr[txPrefix] = txCommited;

        if (amountTo !== null) {
          tr.amountTo = amountTo.toString();
        }
      }

      tr.status = okStatus;

      await tr.save({ transaction });
    });
  } else {
    tx = tr[txPrefix].tx;
  }

  return tx;
}

export async function processTx(
  job: Job,
  order: Orders,
  tx: any
): Promise<boolean> {
  if (typeof order.derivedWallet === 'undefined') {
    throw new OrderDeriveWalletNotFound();
  }

  if (order.derivedWallet.invoice === null) {
    throw new OrderDeriveWalletInvoiceNotFound();
  }

  const txInOut =
    order.type === 'DEPOSIT'
      ? order.inTx
      : order.type === 'WITHDRAWAL'
      ? order.outTx
      : null;

  if (erc20Contract === null) {
    throw new OrderUnknownType();
  }

  const erc20Contract = erc20Contracts[txInOut.coin];

  const txHash = tx.hash ?? tx.transactionHash;
  const txRaw = tx.raw ?? tx.rawTransaction;
  let transferDecl = null;

  for (const decl of erc20Contract._jsonInterface) {
    if (decl.name === 'Transfer' && decl.anonymous === false) {
      transferDecl = decl;

      break;
    }
  }

  if (transferDecl === null) {
    throw new TransferEventDeclDoesntExist();
  }

  do {
    let txNotFetched = true;
    let currentBlock: number;
    let txStatus: TransactionReceipt | null = null;
    let transferEvent = null;
    let tryFetchNumber = 0;

    do {
      currentBlock = await web3.eth.getBlockNumber();

      try {
        txStatus = await web3.eth.getTransactionReceipt(txHash);
      } catch {
        await web3.eth.sendSignedTransaction(txRaw);

        continue;
      }

      let multipleTransferEvent = false;

      if (txStatus.status) {
        for (const log of txStatus.logs) {
          if (transferEvent !== null) {
            multipleTransferEvent = true;
          }

          if (
            log.topics.length > 0 &&
            log.topics[0] === transferDecl.signature
          ) {
            transferEvent = web3.eth.abi.decodeLog(
              transferDecl.inputs,
              log.data,
              log.topics.slice(1)
            );
          }
        }
      }

      txNotFetched =
        txStatus === null ||
        !txStatus.status ||
        transferEvent === null ||
        multipleTransferEvent ||
        transferEvent.to !== order.derivedWallet.invoice ||
        transferEvent.amount === null;

      if (txNotFetched) {
        tryFetchNumber += 1;

        if (tryFetchNumber >= appConfig.ethereumBlockTryCheckNumber) {
          console.error(
            `Job ${inspect(job.id)} skipped transaction ${inspect(txHash)}: ` +
              `unknown, pending, reverted, Transfer event doesn't ` +
              `exist, multiple Transfer event, recipient's address ` +
              `doesn't match`
          );

          return false;
        }

        if ((await web3.eth.getTransaction(txHash)) === null) {
          await web3.eth.sendSignedTransaction(txRaw);
        } else {
          await new Promise((resolve, _reject) => {
            setTimeout(() => resolve(), appConfig.ethereumBlockCheckTime);
          });
        }
      }
    } while (txNotFetched);

    let txInitial = false;
    const assetDecimals = new Decimal(
      await erc20Contract.methods.decimals().call()
    );
    /* eslint-disable @typescript-eslint/no-non-null-assertion */
    const amountFrom = new Decimal(transferEvent!.amount)
      .div(Decimal.pow(10, assetDecimals))
      .toString();
    const confirmations = currentBlock - txStatus!.blockNumber + 1;
    /* eslint-enable @typescript-eslint/no-non-null-assertion */
    const dontUpdate =
      txInOut.confirmations >= txInOut.maxConfirmations ? true : false;

    if (dontUpdate) {
      return true;
    }

    const commitStatus = await sequelize.transaction(
      async (transaction: Transaction) => {
        const existingTx = await TransactionsModel.findOne({
          attributes: ['id'],
          where: {
            id: { [SequelizeOp.ne]: tr.id },
            [txPrefix]: { tx: { hash: txHash } },
          },
          transaction,
        });

        if (existingTx !== null) {
          return false;
        }

        if (tr[txCreatedAtPrefix] === null) {
          tr[txCreatedAtPrefix] = new Date();
        }

        if (typeof txCommited.tx === 'undefined' || txCommited.tx == null) {
          txCommited.tx = tx;
          txCommited.txId = txHash;
          txInitial = true;
        }

        let txStatusChanged = false;

        if (
          tr.status === previousStatus ||
          tr.status === pendingStatus ||
          (tr.status === errorStatus &&
            (confirmations < appConfig.ethereumRequiredConfirmations ||
              (typeof txCommited.txStatus === 'undefined' &&
                txCommited.txStatus === null)))
        ) {
          txCommited.txStatus = txStatus;
          txStatusChanged = true;
        }

        if (
          txInitial ||
          txStatusChanged ||
          txCommited.confirmations !== confirmations
        ) {
          txCommited.confirmations = confirmations;
          tr[txPrefix] = txCommited;
        }

        if (
          tr.status === previousStatus ||
          tr.status === pendingStatus ||
          tr.status === errorStatus
        ) {
          if (commitPrefix === 'receive' && tr.amountFrom !== amountFrom) {
            tr.amountFrom = amountFrom;
          }

          tr.status = status;
        }

        await tr.save({ transaction });

        return true;
      }
    );

    if (!commitStatus) {
      return false;
    }

    if (tr.status !== okStatus) {
      await new Promise((resolve, _reject) => {
        setTimeout(() => resolve(), appConfig.ethereumBlockCheckTime);
      });
    }
  } while (tr.status !== okStatus);

  return true;
}

export async function fetchAndProcessTx(
  job: Job,
  order: Orders,
  event: EventData
): Promise<boolean> {
  let tx;
  let tryFetchNumber = 0;

  do {
    tx = await web3.eth.getTransaction(event.transactionHash);

    if (tx === null) {
      tryFetchNumber += 1;

      if (tryFetchNumber >= appConfig.ethereumBlockTryCheckNumber) {
        console.error(
          `Job ${inspect(job.id)} skipped event ${inspect(
            event.transactionHash
          )}: unknown or pending`
        );

        return false;
      }

      await new Promise((resolve, _reject) => {
        setTimeout(() => resolve(), appConfig.ethereumBlockCheckTime);
      });
    }
  } while (tx === null);

  return processTx(job, order, tx);
}

export async function fetchAllHistoricalBlock(
  job: Job,
  order: Orders,
  taskStatus: TaskStatus
): Promise<boolean> {
  if (typeof order.derivedWallet === 'undefined') {
    throw new OrderDeriveWalletNotFound();
  }

  if (order.derivedWallet.invoice === null) {
    throw new OrderDeriveWalletInvoiceNotFound();
  }

  const erc20Contract = erc20Contracts[order.outTx.coin];
  const currentBlock = await web3.eth.getBlockNumber();
  let lastError = null;

  for (const rightBlock of range(currentBlock, 0, -appConfig.web3BatchSize)) {
    if (taskStatus.resolved()) {
      return false;
    }

    let leftBlock = rightBlock - appConfig.web3BatchSize + 1;

    leftBlock = leftBlock > 0 ? leftBlock : 0;

    let events = null;

    try {
      events = await erc20Contract.getPastEvents('Transfer', {
        filter: {
          to: order.derivedWallet.invoice,
        },
        fromBlock: leftBlock,
        toBlock: rightBlock,
      });
    } catch (error) {
      console.error(
        `Job ${inspect(job.id)} skipped blocks from ${inspect(
          leftBlock
        )} to ${inspect(rightBlock)}`,
        error
      );
      lastError = error;
    }

    if (events !== null) {
      for (const event of events) {
        const processed = await fetchAndProcessTx(job, order, event);

        if (processed) {
          return true;
        }
      }
    }
  }

  if (lastError !== null) {
    throw lastError;
  }

  return false;
}

export async function fetchAllNewBlock(job: Job,
  order: Orders
): Promise<boolean> {
  return new Promise((resolve, reject) => {
    if (typeof order.derivedWallet === 'undefined') {
      throw new OrderDeriveWalletNotFound();
    }

    if (order.derivedWallet.invoice === null) {
      throw new OrderDeriveWalletInvoiceNotFound();
    }

    const erc20Contract = erc20Contracts[order.outTx.coin];

    erc20Contract.once(
      'Transfer',
      {
        filter: {
          to: order.derivedWallet.invoice,
        },
      },
      (eventError: Error, event: EventData) => {
        if (taskStatus.resolved()) {
          resolve(false);
        }

        if (eventError !== null) {
          reject(eventError);
        }

        fetchAndProcessTx(job, order, event).then(
          (processed: boolean) => resolve(processed),
          (processError) => reject(processError)
        );
      }
    );
  });
}

export async function fetchBlockUntilTxFound(
  job: Job,
  order: Orders
): Promise<boolean> {
  if (order.outTx.coin !== 'USDT') {
    throw new UnknownCoinFrom();
  }

  const orderCloned = await sequelize.transaction(
    async (transaction: Transaction) => {
      const maybeOrderCloned = await Orders.findByPk(order.id, {
        include: [
          {
            model: DerivedWallets,
            as: 'derivedWallet',
            include: [{ model: Wallets, as: 'wallet' }],
          },
        ],
        transaction,
      });

      if (maybeOrderCloned === null) {
        throw new OrderNotFound();
      }

      return maybeOrderCloned;
    }
  );

  return resolveAny(job, [
    {
      handler: async (taskStatus: TaskStatus): Promise<boolean> => {
        return fetchAllHistoricalBlock(job, orderCloned);
      },
      skip: true,
    },
    {
      handler: async (taskStatus: TaskStatus): Promise<boolean> => {
        return fetchAllNewBlock(job, order);
      },
      skip: false,
    },
  ]);
}
