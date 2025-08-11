# 01-Database-Design-Overview

The database is the heart of any accounting system. It's the digital ledger where every financial event is meticulously recorded, providing an immutable record of a business's financial history. All the principles we discussed in the `01-Foundations` directory, such as double-entry bookkeeping and the Chart of Accounts, are enforced and made actionable by a well-designed database schema.

Our design philosophy is simple: create a robust, scalable, and auditable system based on core accounting principles. We've chosen a relational database model because it's the most reliable way to maintain the integrity of financial data and enforce strict rules between our tables.

---

### The Core Tables: A Relational Ledger

Our system is built around three core tables that work together to form a complete accounting ledger. 

* **`account_types`**: This table is our **master list of categories**. It defines the fundamental nature of every account in the system, such as `Assets`, `Liabilities`, and `Revenue`. The critical piece of information here is the `normal_balance` field, which dictates whether an account increases with a debit or a credit.

* **`chart_of_accounts`**: This is our **master list of individual accounts**. It’s the digital version of the Chart of Accounts we discussed earlier. This table links each account (e.g., `Cash`, `Sales Revenue`) to a specific `account_type_id` and uses a `parent_id` to build a powerful hierarchical structure.

* **`transactions`**: This is the **journal of all financial events**. Every transaction, every debit and credit, is recorded in this table. It links back to a specific account in the `chart_of_accounts` table using `account_id`. The `debit` and `credit` columns, along with the `reference_no` and `reversal_of_transaction_id` fields, ensure that we can capture every detail and maintain a complete audit trail.

---

### The Importance of Relationships

The power of this design lies in the **relationships** between these tables. The foreign keys act as guardrails, preventing invalid data from being entered. For instance, a transaction can only be recorded if it's linked to a valid account in the `chart_of_accounts`, and an account can only exist if it belongs to a valid `account_type`. This relational integrity is what makes our system both accurate and reliable.

With this structure in place, we can now proceed to define the exact schema in SQL and bring our system to life.