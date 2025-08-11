'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create the 'account_types' table
    await queryInterface.createTable('account_types', {
      account_type_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
      },
      description: {
        type: Sequelize.TEXT,
      },
      normal_balance: {
        type: Sequelize.ENUM('DR', 'CR'),
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // Create the 'parties' table
    await queryInterface.createTable('parties', {
      party_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      party_type: {
        type: Sequelize.ENUM('Customer', 'Supplier', 'Employee', 'Other'),
        allowNull: false,
      },
      contact_info: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // Create the 'chart_of_accounts' table
    await queryInterface.createTable('chart_of_accounts', {
      account_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      account_type_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'account_types',
          key: 'account_type_id',
        },
      },
      account_no: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
      },
      parent_id: {
        type: Sequelize.UUID,
        references: {
          model: 'chart_of_accounts',
          key: 'account_id',
        },
      },
      description: {
        type: Sequelize.TEXT,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // Create the 'invoices' table
    await queryInterface.createTable('invoices', {
      invoice_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      party_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'parties',
          key: 'party_id',
        },
      },
      invoice_no: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
      },
      issue_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      due_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      total_amount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('Draft', 'Sent', 'Paid', 'Cancelled'),
        defaultValue: 'Draft',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // Create the 'bills' table
    await queryInterface.createTable('bills', {
      bill_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      party_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'parties',
          key: 'party_id',
        },
      },
      bill_no: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
      },
      issue_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      due_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      total_amount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('Draft', 'Received', 'Paid', 'Cancelled'),
        defaultValue: 'Received',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // Create the 'transactions' table
    await queryInterface.createTable('transactions', {
      transaction_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      account_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'chart_of_accounts',
          key: 'account_id',
        },
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
      },
      debit: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0.00,
      },
      credit: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0.00,
      },
      reference_no: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      is_posted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      reversal_of_transaction_id: {
        type: Sequelize.UUID,
        references: {
          model: 'transactions',
          key: 'transaction_id',
        },
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Drop the tables in reverse order to respect foreign key constraints
    await queryInterface.dropTable('transactions');
    await queryInterface.dropTable('bills');
    await queryInterface.dropTable('invoices');
    await queryInterface.dropTable('chart_of_accounts');
    await queryInterface.dropTable('parties');
    await queryInterface.dropTable('account_types');
  }
};