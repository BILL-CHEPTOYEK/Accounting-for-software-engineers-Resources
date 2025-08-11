### How a Transaction Works

After setting up our database schema, the next logical question is: "How do I actually record a transaction?" This guide provides a step-by-step walkthrough of how a real-world business event is translated into the two-sided entries that make our double-entry system work.

Every transaction, no matter how complex, follows this simple, four-step pattern.

***

### Step 1: The Business Event

First, a financial event occurs in the real world.

* **Example:** A customer pays you **$500 in cash** for a service you just completed.

### Step 2: Identify the Affected Accounts

Next, we identify the two or more accounts that are affected by this event.

* In our example, **Cash** and **Service Revenue** are the two accounts involved.

### Step 3: Apply the Double-Entry Principle

This is the most important part. Based on the five account types, we determine whether each account should be debited or credited.

* **Cash** is an **Asset**. We received cash, so our assets **increased**. To increase an Asset account, we must **Debit** it.
* **Service Revenue** is a **Revenue** account. We earned money, so our revenue **increased**. To increase a Revenue account, we must **Credit** it.

Our double-entry rule holds true: we have a $500 debit and a $500 credit.

### Step 4: Record the Transaction in the Database

Finally, we translate this logic into database entries. The two sides of the transaction are recorded in separate rows in the `transactions` table, but they are linked together by a common `reference_no` (and sometimes, a `transaction_id` if we group them).

Here is how the two entries would look:

* **Debit Entry:**
    * `transaction_id`: A unique ID for this entry.
    * `account_id`: The UUID for the **Cash** account.
    * `date`: The date the transaction occurred.
    * `description`: "Cash received for service".
    * `debit`: `500.00`
    * `credit`: `0.00`
    * `reference_no`: "INV-001" (A common invoice or receipt number)

* **Credit Entry:**
    * `transaction_id`: Another unique ID.
    * `account_id`: The UUID for the **Service Revenue** account.
    * `date`: The same date.
    * `description`: "Cash received for service".
    * `debit`: `0.00`
    * `credit`: `500.00`
    * `reference_no`: "INV-001"

This process ensures that our system is always balanced and that we have a complete, auditable trail for every single financial event.