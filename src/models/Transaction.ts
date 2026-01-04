import { Sequelize, DataTypes, Model } from 'sequelize';

export class Transaction extends Model {
  public id!: number;
  public userId!: number;
  public type!: string;
  public amount!: number;
  public description!: string;
  public createdAt!: Date;
}

export function initTransaction(sequelize: Sequelize) {
  Transaction.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      type: {
        type: DataTypes.STRING,
        allowNull: false
      },
      amount: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      description: {
        type: DataTypes.STRING,
        allowNull: true
      }
    },
    {
      sequelize,
      tableName: 'transactions',
      timestamps: false,
      underscored: false,
      createdAt: false,
      updatedAt: false
    }
  );

  return Transaction;
}
