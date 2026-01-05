'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        unique: true,
        comment: 'Telegram User ID'
      },
      username: {
        type: Sequelize.STRING,
        allowNull: true
      },
      first_name: {
        type: Sequelize.STRING,
        allowNull: true
      },
      last_name: {
        type: Sequelize.STRING,
        allowNull: true
      },
      currency: {
        type: Sequelize.INTEGER,
        defaultValue: 1000,
        comment: 'Game currency amount'
      },
      level: {
        type: Sequelize.INTEGER,
        defaultValue: 1
      },
      status: {
        type: Sequelize.STRING,
        defaultValue: 'novice'
      },
      total_income: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: 'Total passive income per day'
      },
      total_assets: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      last_income_claim: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });

    await queryInterface.createTable('user_assets', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: Sequelize.INTEGER,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE'
      },
      industry_id: {
        type: Sequelize.STRING,
        comment: 'e.g., showbiz, finances, tech'
      },
      asset_id: {
        type: Sequelize.STRING,
        comment: 'e.g., music_label, savings_bank'
      },
      current_income: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: 'Current passive income from this asset'
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });

    await queryInterface.createTable('asset_actions', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: Sequelize.INTEGER,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE'
      },
      asset_id: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Asset ID from industries data (e.g., music_label, savings_bank)'
      },
      action_id: {
        type: Sequelize.STRING,
        allowNull: false
      },
      current_level: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: 'How many times this action succeeded (0 = not unlocked)'
      },
      current_cost: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: 'Current cost for next execution'
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });

    await queryInterface.createTable('achievements', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: Sequelize.INTEGER,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE'
      },
      achievement_id: {
        type: Sequelize.STRING
      },
      unlocked: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      unlocked_at: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    await queryInterface.createTable('transactions', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: Sequelize.INTEGER,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE'
      },
      type: {
        type: Sequelize.STRING,
        comment: 'buy_asset, action, income_claim'
      },
      amount: {
        type: Sequelize.INTEGER
      },
      description: {
        type: Sequelize.STRING
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });

    await queryInterface.addIndex('user_assets', ['user_id', 'industry_id', 'asset_id']);
    await queryInterface.addIndex('asset_actions', ['user_id', 'asset_id']);
    await queryInterface.addIndex('achievements', ['user_id', 'achievement_id']);
    await queryInterface.addIndex('transactions', ['user_id', 'created_at']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('transactions');
    await queryInterface.dropTable('achievements');
    await queryInterface.dropTable('asset_actions');
    await queryInterface.dropTable('user_assets');
    await queryInterface.dropTable('users');
  }
};
