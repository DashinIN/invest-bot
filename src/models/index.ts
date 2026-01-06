import { Sequelize } from 'sequelize';
import { initUser, User } from './User';
import { initUserAsset, UserAsset } from './UserAsset';
import { initAssetAction, AssetAction } from './AssetAction';
import { initAchievement, Achievement } from './Achievement';
import { initTransaction, Transaction } from './Transaction';

export class Database {
  private sequelize: Sequelize;
  private keepAliveInterval: NodeJS.Timeout | null = null;

  constructor(databaseUrl: string) {
    this.sequelize = new Sequelize(databaseUrl, {
      dialect: 'postgres',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      ssl: process.env.NODE_ENV === 'production',
      // Pool configuration to handle Railway timeout issues
      pool: {
        max: 5,
        min: 2,
        idle: 30000, // Close idle connections after 30 seconds
        acquire: 30000,
        evict: 30000
      },
      connectTimeout: 30000,
      idle: 30000,
      dialectOptions: {
        // Enable keepalive on the TCP socket
        keepalives: 1,
        keepalivesIdle: 30000 // Send keepalive every 30 seconds
      }
    } as any);
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

    // Start keepalive pings to prevent Railway timeout
    this.startKeepalive();

    // Sync database (create tables if they don't exist)
    await this.sequelize.sync({ alter: true });
    console.log('✅ Database tables synchronized');
  }

  async sync() {
    await this.sequelize.sync({ alter: true });
    console.log('✅ Database synchronized');
  }

  /**
   * Start keepalive pings to prevent Railway database timeout
   * Runs a simple query every 25 seconds to keep connection alive
   */
  private startKeepalive() {
    if (this.keepAliveInterval) {
      return; // Already running
    }

    this.keepAliveInterval = setInterval(async () => {
      try {
        await this.sequelize.authenticate();
        // console.log('🔄 Database keepalive ping sent');
      } catch (error) {
        console.error('❌ Keepalive ping failed:', error);
      }
    }, 25000); // 25 seconds - keeps connection alive on Railway
  }

  /**
   * Stop keepalive pings (called on shutdown)
   */
  public stopKeepalive() {
    if (this.keepAliveInterval) {
      clearTimeout(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }
  }

  getSequelize() {
    return this.sequelize;
  }
}

export { User, UserAsset, AssetAction, Achievement, Transaction };
