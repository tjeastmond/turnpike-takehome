#!/usr/bin/env python3
import duckdb
import pandas as pd
import csv

# Connect to database (creates it if it doesn't exist)
con = duckdb.connect('taxes.duckdb')

# Read CSV file properly
transactions = []
with open('docs/stmt.csv', 'r') as f:
    # Skip the first 7 lines (header and summary)
    for _ in range(7):
        next(f)
    
    # Now read the transaction data
    reader = csv.reader(f)
    for row in reader:
        if len(row) >= 4 and row[0]:  # Has date
            try:
                date = row[0]
                description = row[1]
                amount_str = row[2].replace(',', '').replace('"', '').strip()
                running_bal_str = row[3].replace(',', '').replace('"', '').strip()
                
                # Parse amounts
                amount = float(amount_str) if amount_str and amount_str != '' else None
                running_bal = float(running_bal_str) if running_bal_str and running_bal_str != '' else None
                
                transactions.append({
                    'date': date,
                    'description': description,
                    'amount': amount,
                    'running_bal': running_bal,
                    'deductible': False,
                    'category': None
                })
            except ValueError:
                # Skip rows that can't be parsed
                continue

# Create DataFrame and load into DuckDB
df = pd.DataFrame(transactions)
print(f"Parsed {len(df)} transactions")
con.execute("CREATE OR REPLACE TABLE transactions AS SELECT * FROM df")

print("Table created successfully!")
print("\nTable structure:")
print(con.execute("DESCRIBE transactions").df())

print("\nFirst 10 rows:")
print(con.execute("SELECT * FROM transactions LIMIT 10").df())

print(f"\nTotal rows: {con.execute('SELECT COUNT(*) FROM transactions').fetchone()[0]}")

# Show date range
date_range = con.execute("""
    SELECT MIN(date) as first_date, MAX(date) as last_date 
    FROM transactions
""").df()
print(f"\nDate range: {date_range['first_date'].iloc[0]} to {date_range['last_date'].iloc[0]}")

con.close()
print("\nDatabase saved to: taxes.duckdb")
