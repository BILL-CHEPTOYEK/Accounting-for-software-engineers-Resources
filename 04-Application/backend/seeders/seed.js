// /04-Application/backend/seeders/seed.js

const db = require('../models');

const seedData = async () => {
  try {
    console.log('Seeding initial data...');
    // Create the Account Types
    const [assets] = await db.AccountType.findOrCreate({ where: { name: 'Assets' }, defaults: { normal_balance: 'DR' } });
    const [liabilities] = await db.AccountType.findOrCreate({ where: { name: 'Liabilities' }, defaults: { normal_balance: 'CR' } });
    const [equity] = await db.AccountType.findOrCreate({ where: { name: 'Equity' }, defaults: { normal_balance: 'CR' } });
    const [revenue] = await db.AccountType.findOrCreate({ where: { name: 'Revenue' }, defaults: { normal_balance: 'CR' } });
    const [expenses] = await db.AccountType.findOrCreate({ where: { name: 'Expenses' }, defaults: { normal_balance: 'DR' } });

    // Create a basic Chart of Accounts
    await db.ChartOfAccount.findOrCreate({ where: { name: 'Cash' }, defaults: { account_type_id: assets.account_type_id, account_no: '101' } });
    await db.ChartOfAccount.findOrCreate({ where: { name: 'Accounts Receivable' }, defaults: { account_type_id: assets.account_type_id, account_no: '102' } });
    await db.ChartOfAccount.findOrCreate({ where: { name: 'Accounts Payable' }, defaults: { account_type_id: liabilities.account_type_id, account_no: '201' } });
    await db.ChartOfAccount.findOrCreate({ where: { name: 'Sales Revenue' }, defaults: { account_type_id: revenue.account_type_id, account_no: '401' } });
    await db.ChartOfAccount.findOrCreate({ where: { name: 'Cost of Goods Sold' }, defaults: { account_type_id: expenses.account_type_id, account_no: '501' } });

    console.log('Seeding complete!');
  } catch (error) {
    console.error('Error seeding data:', error);
  }
};

module.exports = seedData;