/*
This script populates the core tables with initial data.
It's designed to provide a working example of a Chart of Accounts and a sample transaction.
*/

-- Inserts for the account_types table
-- These are the five main categories of accounts.
INSERT INTO account_types (account_type_id, name, description, normal_balance) VALUES
('a260844f-d009-4113-a4c3-e847c0b299e1', 'Assets', 'Resources owned by the company.', 'DR'),
('340624d5-0370-4d40-b30f-90e6e788c0dc', 'Liabilities', 'Obligations owed to external parties.', 'CR'),
('04948a73-02f5-4424-8149-a29938b81347', 'Equity', 'The owner''s stake in the business.', 'CR'),
('f88b7f80-7787-4344-93b5-77cf897911b3', 'Revenue', 'Income from primary business activities.', 'CR'),
('20e7a2b9-2917-4952-b166-41804f5e7f1e', 'Expenses', 'Costs incurred to generate revenue.', 'DR');

-- Inserts for the chart_of_accounts table
-- These accounts form a simple, hierarchical Chart of Accounts.
INSERT INTO chart_of_accounts (account_id, name, account_type_id, account_no, parent_id, description) VALUES
-- Parent Accounts
('277873b7-782a-4389-9a79-28f0003b1285', 'Cash and Cash Equivalents', 'a260844f-d009-4113-a4c3-e847c0b299e1', '1000', NULL, 'Assets that are easily converted to cash.'),
('714c330c-25d1-4357-9d7a-b9c1d0f507b1', 'Current Liabilities', '340624d5-0370-4d40-b30f-90e6e788c0dc', '2000', NULL, 'Liabilities due within one year.'),
('80b5514f-6950-459f-863a-b850901e149c', 'Sales & Revenue', 'f88b7f80-7787-4344-93b5-77cf897911b3', '4000', NULL, 'Income from the sale of goods and services.'),
('97e685f8-80f2-4521-827d-0e42775f0a20', 'Operating Expenses', '20e7a2b9-2917-4952-b166-41804f5e7f1e', '6000', NULL, 'Costs related to the core operations of the business.'),
('c4897c9b-6b21-4f10-91a6-f36551b9e84b', 'Owners'' Equity', '04948a73-02f5-4424-8149-a29938b81347', '3000', NULL, 'The owner''s remaining claim to assets.'),

-- Child Accounts
('a482d8c3-4c91-443b-8534-1c662828a2b5', 'Cash', 'a260844f-d009-4113-a4c3-e847c0b299e1', '1001', '277873b7-782a-4389-9a79-28f0003b1285', 'Physical and bank cash.'),
('6983b632-1b15-46f9-86c5-430c72c8421c', 'Accounts Receivable', 'a260844f-d009-4113-a4c3-e847c0b299e1', '1002', '277873b7-782a-4389-9a79-28f0003b1285', 'Money owed to the company.'),
('42e4751f-2b0b-42de-8e3d-0d6d536d5423', 'Sales Revenue', 'f88b7f80-7787-4344-93b5-77cf897911b3', '4001', '80b5514f-6950-459f-863a-b850901e149c', 'Revenue from sales of goods.'),
('5f1d46f5-04b3-4f93-b46f-c1f0b0932c02', 'Rent Expense', '20e7a2b9-2917-4952-b166-41804f5e7f1e', '6001', '97e685f8-80f2-4521-827d-0e42775f0a20', 'Cost of rent for business premises.'),
('2110c74a-25c2-40f4-a5e2-2a62886f4a34', 'Owner''s Capital', '04948a73-02f5-4424-8149-a29938b81347', '3001', 'c4897c9b-6b21-4f10-91a6-f36551b9e84b', 'Initial and additional investment by owner.');


-- Sample transaction
-- This transaction records a sale of $500, paid in cash.
-- It demonstrates the double-entry principle where total debits equal total credits.
INSERT INTO transactions (transaction_id, account_id, date, description, debit, credit, reference_no, is_posted) VALUES
-- The Debit entry: Cash is an Asset, so a debit increases it.
('e9d7212c-4739-4d64-9642-1678129e18b0', 'a482d8c3-4c91-443b-8534-1c662828a2b5', '2025-01-10', 'Cash sale of goods', 500.00, 0.00, 'INV-001', TRUE),
-- The Credit entry: Sales Revenue is a Revenue account, so a credit increases it.
('a43f8730-1845-4235-9689-53e0202996d9', '42e4751f-2b0b-42de-8e3d-0d6d536d5423', '2025-01-10', 'Cash sale of goods', 0.00, 500.00, 'INV-001', TRUE);