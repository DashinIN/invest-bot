import { Sequelize, DataTypes, Model } from 'sequelize';
import { User } from './User';

export class UserAsset extends Model {
  public id!: number;
  public userId!: number;
  public industryId!: string;
  public assetId!: string;
  public level!: number;
  public currentCost!: number;
  public currentIncome!: number;
  public createdAt!: Date;
  public updatedAt!: Date;
}

export function initUserAsset(sequelize: Sequelize) {
  UserAsset.init(
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
      industryId: {
        type: DataTypes.STRING,
        allowNull: false
      },
      assetId: {
        type: DataTypes.STRING,
        allowNull: false
      },
      level: {
        type: DataTypes.INTEGER,
        defaultValue: 1
      },
      currentCost: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      currentIncome: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      }
    },
    {
      sequelize,
      tableName: 'user_assets',
      timestamps: true,
      underscored: false
    }
  );

  return UserAsset;
}
