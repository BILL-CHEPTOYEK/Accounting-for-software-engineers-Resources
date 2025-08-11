/*
This script defines the three core tables for our double-entry accounting system:
1. account_types: Defines the high-level categories for all accounts.
2. chart_of_accounts: The master list of all individual accounts used for bookkeeping.
3. transactions: The journal for every financial event, enforcing the double-entry principle.
*/

-- Create the ENUM type for normal_balance
CREATE TYPE normal_balance_enum AS ENUM ('DR', 'CR');

-- 1. account_types Table
-- This table categorizes accounts, defining their normal balance.
CREATE TABLE account_types (
    account_type_id UUID PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    normal_balance normal_balance_enum NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. chart_of_accounts Table
-- This table is the master list of all financial accounts. It's self-referencing to create a hierarchy.
CREATE TABLE chart_of_accounts (
    account_id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    account_type_id UUID NOT NULL,
    account_no VARCHAR(50) NOT NULL UNIQUE,
    parent_id UUID,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (account_type_id) REFERENCES account_types(account_type_id),
    FOREIGN KEY (parent_id) REFERENCES chart_of_accounts(account_id)
);

-- 3. transactions Table
-- This is the transaction journal. Each entry records a debit or credit, linked to a specific account.
CREATE TABLE transactions (
    transaction_id UUID PRIMARY KEY,
    account_id UUID NOT NULL,
    date DATE NOT NULL,
    description TEXT,
    debit DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    credit DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    reference_no VARCHAR(50),
    is_posted BOOLEAN NOT NULL DEFAULT FALSE,
    reversal_of_transaction_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (account_id) REFERENCES chart_of_accounts(account_id),
    FOREIGN KEY (reversal_of_transaction_id) REFERENCES transactions(transaction_id)
);