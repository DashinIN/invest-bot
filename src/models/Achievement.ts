import { Sequelize, DataTypes, Model } from 'sequelize';

export class Achievement extends Model {
  public id!: number;
  public userId!: number;
  public achievementId!: string;
  public unlocked!: boolean;
  public unlockedAt?: Date;
}

export function initAchievement(sequelize: Sequelize) {
  Achievement.init(
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
      achievementId: {
        type: DataTypes.STRING,
        allowNull: false
      },
      unlocked: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      unlockedAt: {
        type: DataTypes.DATE,
        allowNull: true
      }
    },
    {
      sequelize,
      tableName: 'achievements',
      timestamps: false,
      underscored: false
    }
  );

  return Achievement;
}
