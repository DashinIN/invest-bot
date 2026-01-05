import { Sequelize, DataTypes, Model } from 'sequelize';

export class AssetAction extends Model {
  public id!: number;
  public userId!: number;
  public assetId!: string;
  public actionId!: string;
  public currentLevel!: number;
  public currentCost!: number;
  public createdAt!: Date;
}

export function initAssetAction(sequelize: Sequelize) {
  AssetAction.init(
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
      assetId: {
        type: DataTypes.STRING,
        allowNull: false
      },
      actionId: {
        type: DataTypes.STRING,
        allowNull: false
      },
      currentLevel: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: 'How many times this action succeeded (0 = not unlocked)'
      },
      currentCost: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: 'Current cost for next execution'
      }
    },
    {
      sequelize,
      tableName: 'asset_actions',
      timestamps: false,
      underscored: false,
      createdAt: false,
      updatedAt: false
    }
  );

  return AssetAction;
}
