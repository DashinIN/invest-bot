import { Sequelize } from 'sequelize';
import { initUser, User } from './User';
import { initUserAsset, UserAsset } from './UserAsset';
import { initAssetAction, AssetAction } from './AssetAction';
import { initAchievement, Achievement } from './Achievement';
import { initTransaction, Transaction } from './Transaction';

export class Database {
  private sequelize: Sequelize;

  constructor(databaseUrl: string) {
    this.sequelize = new Sequelize(databaseUrl, {
      dialect: 'postgres',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      ssl: process.env.NODE_ENV === 'production'
    });
  }

  async init() {
    // Initialize models
    initUser(this.sequelize);
    initUserAsset(this.sequelize);
    initAssetAction(this.sequelize);
    initAchievement(this.sequelize);
    initTransaction(this.sequelize);

    // Set up associations
    User.hasMany(UserAsset, { foreignKey: 'userId', as: 'assets' });
    UserAsset.belongsTo(User, { foreignKey: 'userId' });

    User.hasMany(AssetAction, { foreignKey: 'userId' });
    AssetAction.belongsTo(User, { foreignKey: 'userId' });

    User.hasMany(Achievement, { foreignKey: 'userId', as: 'achievements' });
    Achievement.belongsTo(User, { foreignKey: 'userId' });

    User.hasMany(Transaction, { foreignKey: 'userId', as: 'transactions' });
    Transaction.belongsTo(User, { foreignKey: 'userId' });

    await this.sequelize.authenticate();
    console.log('✅ Database connected successfully');

    // Sync database (create tables if they don't exist)
    await this.sequelize.sync({ alter: true });
    console.log('✅ Database tables synchronized');
  }

  async sync() {
    await this.sequelize.sync({ alter: true });
    console.log('✅ Database synchronized');
  }

  getSequelize() {
    return this.sequelize;
  }
}

export { User, UserAsset, AssetAction, Achievement, Transaction };
