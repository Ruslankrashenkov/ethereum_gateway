import { Job } from 'bullmq';
import { Transaction } from 'sequelize';

import {
  processTx as bitsharesProcessTx,
  txBurn as bitsharesTxBurn,
  txCommit as bitsharesTxCommit,
  txIssue as bitsharesTxIssue,
  withClient as bitsharesWithClient,
  fetchBlockUntilTxFound as bitsharesfetchBlockUntilTxFound,
} from './bitshares';
import {
  DerivedWallets as DerivedWalletsModel,
  Transactions as TransactionsModel,
  Wallets as WalletsModel,
  sequelize,
  transactionsCatchAndCommitError,
} from './models';
import {
  fetchBlockUntilTxFound as web3FetchBlockUntilTxFound,
  processTx as web3ProcessTx,
  txTransferTo as web3TxTransferTo,
} from './web3';

export class TrNotFound extends Error {}

export class TxNotFound extends Error {}

export class UnknownStatus extends Error {}

export async function ethereumToBitsharesJob(job: Job): Promise<void> {
  const tr = await sequelize.transaction(async (transaction: Transaction) => {
    const maybeTr = await TransactionsModel.findOne({
      where: { jobId: job.id },
      include: [
        {
          model: DerivedWalletsModel,
          as: 'derivedWallet',
          include: [{ model: WalletsModel, as: 'wallet' }],
        },
      ],
      transaction,
    });

    if (maybeTr === null) {
      throw new TrNotFound();
    }

    return maybeTr;
  });

  if (
    tr.status === 'pending' ||
    tr.status === 'receive_pending' ||
    tr.status === 'receive_err'
  ) {
    const result = await transactionsCatchAndCommitError(
      job,
      tr,
      async () => {
        return web3FetchBlockUntilTxFound(job, tr, 'pending', 'receive');
      },
      'receive'
    );

    if (!result) {
      throw new TxNotFound();
    }
  }

  const txIssue = await transactionsCatchAndCommitError(
    job,
    tr,
    async () => {
      return bitsharesWithClient(async () => {
        return bitsharesTxCommit(
          job,
          tr,
          bitsharesTxIssue,
          'receive_ok',
          'issue'
        );
      });
    },
    'issue',
    'commit'
  );

  if (
    tr.status === 'issue_commit_ok' ||
    tr.status === 'issue_pending' ||
    tr.status === 'issue_err'
  ) {
    const result = await transactionsCatchAndCommitError(
      job,
      tr,
      async () => {
        return bitsharesWithClient(async () => {
          return bitsharesProcessTx(
            job,
            tr,
            txIssue,
            0,
            'issue_commit_ok',
            'issue'
          );
        });
      },
      'issue'
    );

    if (!result) {
      throw new TxNotFound();
    }
  }

  if (tr.status === 'issue_ok') {
    await sequelize.transaction(async (transaction: Transaction) => {
      tr.status = 'ok';

      await tr.save({ transaction });
    });

    return;
  }

  throw new UnknownStatus();
}

export async function bitsharesToEthereumJob(job: Job): Promise<void> {
  const tr = await sequelize.transaction(async (transaction: Transaction) => {
    const maybeTr = await TransactionsModel.findOne({
      where: { jobId: job.id },
      include: [
        {
          model: DerivedWalletsModel,
          as: 'derivedWallet',
          include: [{ model: WalletsModel, as: 'wallet' }],
        },
      ],
      transaction,
    });

    if (maybeTr === null) {
      throw new TrNotFound();
    }

    return maybeTr;
  });

  if (
    tr.status === 'pending' ||
    tr.status === 'receive_pending' ||
    tr.status === 'receive_err'
  ) {
    const result = await transactionsCatchAndCommitError(
      job,
      tr,
      async () => {
        return bitsharesWithClient(async () => {
          return bitsharesfetchBlockUntilTxFound(job, tr, 'pending', 'receive');
        });
      },
      'receive'
    );

    if (!result) {
      throw new TxNotFound();
    }
  }

  const txBurn = await transactionsCatchAndCommitError(
    job,
    tr,
    async () => {
      return bitsharesWithClient(async () => {
        return bitsharesTxCommit(
          job,
          tr,
          bitsharesTxBurn,
          'receive_ok',
          'burn'
        );
      });
    },
    'burn',
    'commit'
  );

  if (
    tr.status === 'burn_commit_ok' ||
    tr.status === 'burn_pending' ||
    tr.status === 'burn_err'
  ) {
    const result = await transactionsCatchAndCommitError(
      job,
      tr,
      async () => {
        return bitsharesWithClient(async () => {
          return bitsharesProcessTx(
            job,
            tr,
            txBurn,
            0,
            'burn_commit_ok',
            'burn'
          );
        });
      },
      'burn'
    );

    if (!result) {
      throw new TxNotFound();
    }
  }

  const txTransferTo = await transactionsCatchAndCommitError(
    job,
    tr,
    async () => {
      return web3TxTransferTo(job, tr, 'burn_ok', 'transfer_to');
    },
    'transfer_to',
    'commit'
  );

  if (
    tr.status === 'transfer_to_commit_ok' ||
    tr.status === 'transfer_to_pending' ||
    tr.status === 'transfer_to_err'
  ) {
    const result = await transactionsCatchAndCommitError(
      job,
      tr,
      async () => {
        return web3ProcessTx(
          job,
          tr,
          txTransferTo,
          'transfer_to_commit_ok',
          'transfer_to'
        );
      },
      'transfer_to'
    );

    if (!result) {
      throw new TxNotFound();
    }
  }

  if (tr.status === 'transfer_to_ok') {
    await sequelize.transaction(async (transaction: Transaction) => {
      tr.status = 'ok';

      await tr.save({ transaction });
    });

    return;
  }

  throw new UnknownStatus();
}

export interface Jobs {
  [key: string]: (job: Job) => Promise<void>;
}

export const jobs: Jobs = {
  'payment:ethereum:bitshares': ethereumToBitsharesJob,
  'payment:bitshares:ethereum': bitsharesToEthereumJob,
};
