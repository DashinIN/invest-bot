import { Sequelize, DataTypes, Model } from 'sequelize';

export class User extends Model {
  public id!: number;
  public username?: string;
  public firstName?: string;
  public lastName?: string;
  public currency!: number;
  public level!: number;
  public status!: string;
  public totalIncome!: number;
  public totalAssets!: number;
  public lastIncomeClaim!: Date;
  public createdAt!: Date;
  public updatedAt!: Date;
}

export function initUser(sequelize: Sequelize) {
  User.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        unique: true
      },
      username: {
        type: DataTypes.STRING,
        allowNull: true
      },
      first_name: {
        type: DataTypes.STRING,
        allowNull: true
      },
      last_name: {
        type: DataTypes.STRING,
        allowNull: true
      },
      currency: {
        type: DataTypes.INTEGER,
        defaultValue: 1000
      },
      level: {
        type: DataTypes.INTEGER,
        defaultValue: 1
      },
      status: {
        type: DataTypes.STRING,
        defaultValue: 'novice'
      },
      total_income: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      total_assets: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      last_income_claim: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      }
    },
    {
      sequelize,
      tableName: 'users',
      timestamps: true,
      underscored: true
    }
  );

  return User;
}
