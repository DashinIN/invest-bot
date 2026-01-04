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
      firstName: {
        type: DataTypes.STRING,
        allowNull: true
      },
      lastName: {
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
      totalIncome: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      totalAssets: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      lastIncomeClaim: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      }
    },
    {
      sequelize,
      tableName: 'users',
      timestamps: true,
      underscored: false
    }
  );

  return User;
}
