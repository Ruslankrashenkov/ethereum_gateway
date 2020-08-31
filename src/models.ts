import { Job } from 'bullmq';
import {
  BelongsTo,
  BelongsToCreateAssociationMixin,
  BelongsToGetAssociationMixin,
  BelongsToSetAssociationMixin,
  DataTypes,
  HasMany,
  HasManyAddAssociationMixin,
  HasManyAddAssociationsMixin,
  HasManyCountAssociationsMixin,
  HasManyCreateAssociationMixin,
  HasManyGetAssociationsMixin,
  HasManyHasAssociationMixin,
  HasManyHasAssociationsMixin,
  HasManyRemoveAssociationMixin,
  HasManyRemoveAssociationsMixin,
  HasManySetAssociationsMixin,
  Model,
  Sequelize,
  Transaction,
} from 'sequelize';

import * as configs from './config/config.db';
import { toCamelCase } from './utils';

const env = process.env.NODE_ENV ?? 'development';
const config = configs[env];

export let sequelize: Sequelize;

if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    config
  );
}

export type Payment = 'ethereum' | 'bitshares';

export class Wallets extends Model {
  public id!: number;

  public payment?: Payment;

  public invoice?: string;

  public readonly derivedWallets?: DerivedWallets[];

  public readonly createdAt!: Date;

  public readonly updatedAt!: Date;

  public readonly version!: number;

  public static associations: {
    derivedWallets: HasMany<Wallets, DerivedWallets>;
  };

  public getDerivedWallets!: HasManyGetAssociationsMixin<DerivedWallets>;

  public setDerivedWallets!: HasManySetAssociationsMixin<
    DerivedWallets,
    number
  >;

  public addDerivedWallets!: HasManyAddAssociationsMixin<
    DerivedWallets,
    number
  >;

  public addDerivedWallet!: HasManyAddAssociationMixin<DerivedWallets, number>;

  public removeDerivedWallet!: HasManyRemoveAssociationMixin<
    DerivedWallets,
    number
  >;

  public removeDerivedWallets!: HasManyRemoveAssociationsMixin<
    DerivedWallets,
    number
  >;

  public createDerivedWallets!: HasManyCreateAssociationMixin<DerivedWallets>;

  public hasDerivedWallet!: HasManyHasAssociationMixin<DerivedWallets, number>;

  public hasDerivedWallets!: HasManyHasAssociationsMixin<
    DerivedWallets,
    number
  >;

  public countDerivedWallets!: HasManyCountAssociationsMixin;
}

export class DerivedWallets extends Model {
  public id!: number;

  public payment?: Payment;

  public invoice?: string;

  public walletId!: number;

  public readonly wallet?: Wallets;

  public readonly orders?: Orders[];

  public readonly createdAt!: Date;

  public readonly updatedAt!: Date;

  public readonly version!: number;

  public static associations: {
    wallet: BelongsTo<DerivedWallets, Wallets>;
    orders: HasMany<DerivedWallets, Orders>;
  };

  public getWallet!: BelongsToGetAssociationMixin<Wallets>;

  public setWallet!: BelongsToSetAssociationMixin<Wallets, number>;

  public createWallet!: BelongsToCreateAssociationMixin<Wallets>;

  public getOrders!: HasManyGetAssociationsMixin<Orders>;

  public setOrders!: HasManySetAssociationsMixin<Orders, string>;

  public addOrders!: HasManyAddAssociationsMixin<Orders, string>;

  public addOrder!: HasManyAddAssociationMixin<Orders, string>;

  public removeOrders!: HasManyRemoveAssociationsMixin<Orders, string>;

  public removeOrder!: HasManyRemoveAssociationMixin<Orders, string>;

  public createOrder!: HasManyCreateAssociationMixin<Orders>;

  public hasOrders!: HasManyHasAssociationsMixin<Orders, string>;

  public hasOrder!: HasManyHasAssociationMixin<Orders, string>;

  public countOrders!: HasManyCountAssociationsMixin;
}

export type Coin = 'USDT' | 'FINTEH.USDT';

export interface TxRaw {
  [key: string]: any;
}

export class Txs extends Model {
  public id!: string;

  public coin!: Coin;

  public txId?: string;

  public fromAddress?: string;

  public toAddress?: string;

  public amount!: string;

  public txCreatedAt!: Date;

  public confirmations!: number;

  public maxConfirmations!: number;

  public tx?: TxRaw;

  public readonly createdAt!: Date;

  public readonly updatedAt!: Date;

  public readonly version!: number;
}

export type OrderType = 'TRASH' | 'DEPOSIT' | 'WITHDRAWAL';

export type Party = 'INIT' | 'IN_CREATED' | 'OUT_CREATED';

export class Orders extends Model {
  public id!: string;

  public jobId!: string;

  public walletId!: number;

  public readonly derivedWallet?: DerivedWallets;

  public type!: OrderType;

  public party!: Party;

  public inTxId!: string;

  public readonly inTx?: Txs;

  public outTxId!: string;

  public readonly outTx?: Txs;

  public readonly createdAt!: Date;

  public readonly updatedAt!: Date;

  public readonly version!: number;

  public static associations: {
    derivedWallet: BelongsTo<Orders, DerivedWallets>;
    inTx: BelongsTo<Orders, Txs>;
    outTx: BelongsTo<Orders, Txs>;
  };

  public getDerivedWallet!: BelongsToGetAssociationMixin<DerivedWallets>;

  public setDerivedWallet!: BelongsToSetAssociationMixin<
    DerivedWallets,
    number
  >;

  public createDerivedWallet!: BelongsToCreateAssociationMixin<DerivedWallets>;

  public getInTx: BelongsToGetAssociationMixin<Txs>;

  public setInTx!: BelongsToSetAssociationMixin<Txs, string>;

  public createInTx!: BelongsToCreateAssociationMixin<Txs>;

  public getOutTx: BelongsToGetAssociationMixin<Txs>;

  public setOutTx!: BelongsToSetAssociationMixin<Txs, string>;

  public createOutTx!: BelongsToCreateAssociationMixin<Txs>;
}

export interface Task<T> {
  (): Promise<T>;
}

export type TransactionsCommitPrefix =
  | 'receive'
  | 'issue'
  | 'burn'
  | 'transfer_from'
  | 'transfer_to';

export type TransactionsStatusPostfix = '' | 'commit';

export async function transactionsCatchAndCommitError<T>(
  _job: Job,
  model: Transactions,
  task: Task<T>,
  commitPrefix: TransactionsCommitPrefix,
  statusPostfix: TransactionsStatusPostfix = ''
): Promise<T> {
  try {
    return await task();
  } catch (error) {
    if (statusPostfix.length > 0) {
      statusPostfix += '_';
    }

    statusPostfix += 'err';

    const ccCommitPrefix = toCamelCase(commitPrefix);
    const status = `${commitPrefix}_${statusPostfix}` as TransactionsStatus;

    const txPrefix = `tx${ccCommitPrefix
      .charAt(0)
      .toUpperCase()}${ccCommitPrefix.substring(1)}`;

    await sequelize.transaction(async (transaction: Transaction) => {
      model.status = status;

      const txCommited: Tx = model[txPrefix] ?? {};

      if (error instanceof Error) {
        txCommited.lastError = {
          name: error.name,
          message: error.message,
          stacktrace: error.stack,
        };
      } else {
        txCommited.lastError = error;
      }

      model[txPrefix] = txCommited;

      await model.save({ transaction });
    });

    throw error;
  }
}

Wallets.init(
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
      autoIncrementIdentity: true,
    },
    payment: {
      type: DataTypes.ENUM('ethereum', 'bitshares'),
      allowNull: false,
    },
    invoice: { type: DataTypes.JSONB, allowNull: false },
  },
  {
    sequelize,
    timestamps: true,
    paranoid: true,
    version: true,
    initialAutoIncrement: true,
  }
);

DerivedWallets.init(
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
      autoIncrementIdentity: true,
    },
    payment: {
      type: DataTypes.ENUM('ethereum', 'bitshares'),
      allowNull: false,
    },
    invoice: { type: DataTypes.JSONB, allowNull: false },
  },
  {
    sequelize,
    timestamps: true,
    paranoid: true,
    version: true,
    initialAutoIncrement: true,
  }
);

Transactions.init(
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
      autoIncrementIdentity: true,
    },
    jobId: {
      type: DataTypes.UUID,
      unique: true,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
    },
    tickerFrom: {
      type: DataTypes.ENUM('USDT', 'FINTEH.USDT'),
      allowNull: false,
    },
    amountFrom: DataTypes.DECIMAL(40, 20).UNSIGNED,
    tickerTo: { type: DataTypes.ENUM('USDT', 'FINTEH.USDT'), allowNull: false },
    amountTo: DataTypes.DECIMAL(40, 20).UNSIGNED,
    status: {
      type: DataTypes.ENUM(
        'pending',
        'receive_pending',
        'receive_ok',
        'receive_err',
        'issue_commit_ok',
        'issue_commit_err',
        'issue_pending',
        'issue_ok',
        'issue_err',
        'burn_commit_ok',
        'burn_commit_err',
        'burn_pending',
        'burn_ok',
        'burn_err',
        'transfer_from_commit_ok',
        'transfer_from_commit_err',
        'transfer_from_pending',
        'transfer_from_ok',
        'transfer_from_err',
        'transfer_to_commit_ok',
        'transfer_to_commit_err',
        'transfer_to_pending',
        'transfer_to_ok',
        'transfer_to_err',
        'ok'
      ),
      allowNull: false,
      defaultValue: 'pending',
    },
    txReceive: DataTypes.JSONB,
    txReceiveCreatedAt: DataTypes.DATE,
    txIssue: DataTypes.JSONB,
    txIssueCreatedAt: DataTypes.DATE,
    txBurn: DataTypes.JSONB,
    txBurnCreatedAt: DataTypes.DATE,
    txTransferFrom: DataTypes.JSONB,
    txTransferFromCreatedAt: DataTypes.DATE,
    txTransferTo: DataTypes.JSONB,
    txTransferToCreatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    timestamps: true,
    paranoid: true,
    version: true,
    initialAutoIncrement: true,
  }
);

Wallets.hasMany(DerivedWallets, {
  as: 'derivedWallets',
  foreignKey: 'walletId',
});
DerivedWallets.belongsTo(Wallets, { as: 'wallet', foreignKey: 'walletId' });
DerivedWallets.hasMany(Transactions, {
  as: 'transactions',
  foreignKey: 'walletId',
});
Transactions.belongsTo(DerivedWallets, {
  as: 'derivedWallet',
  foreignKey: 'walletId',
});
