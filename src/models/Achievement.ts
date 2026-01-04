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
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      achievement_id: {
        type: DataTypes.STRING,
        allowNull: false
      },
      unlocked: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      unlocked_at: {
        type: DataTypes.DATE,
        allowNull: true
      }
    },
    {
      sequelize,
      tableName: 'achievements',
      timestamps: false,
      underscored: true
    }
  );

  return Achievement;
}
