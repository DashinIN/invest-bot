import { Sequelize, DataTypes, Model } from 'sequelize';

export class AssetAction extends Model {
  public id!: number;
  public userId!: number;
  public assetId!: number;
  public actionId!: string;
  public level!: number;
  public succeeded!: boolean;
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
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      asset_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      action_id: {
        type: DataTypes.STRING,
        allowNull: false
      },
      level: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      succeeded: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      }
    },
    {
      sequelize,
      tableName: 'asset_actions',
      timestamps: false,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: false
    }
  );

  return AssetAction;
}
