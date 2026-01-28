-- Create table from CSV with additional columns
CREATE OR REPLACE TABLE transactions AS
SELECT 
    CAST(SPLIT_PART(column0, ',', 1) AS INTEGER) AS line_number,
    TRIM(SPLIT_PART(column0, ',', 2), '"') AS date,
    TRIM(REPLACE(REPLACE(SPLIT_PART(column0, ',', 3), '"', ''), '\r', '')) AS description,
    TRY_CAST(REPLACE(REPLACE(SPLIT_PART(column0, ',', 4), '"', ''), ',', '') AS DECIMAL(10,2)) AS amount,
    TRY_CAST(REPLACE(REPLACE(SPLIT_PART(column0, ',', 5), '"', ''), ',', '') AS DECIMAL(10,2)) AS running_bal,
    FALSE AS deductible,
    CAST(NULL AS VARCHAR) AS category
FROM read_csv_auto('docs/stmt.csv', 
    header=false, 
    delim='|',
    columns={'column0': 'VARCHAR'}
)
WHERE line_number > 7  -- Skip the header/summary rows
  AND date IS NOT NULL 
  AND date != '';

-- Display the table structure
DESCRIBE transactions;

-- Show first few rows
SELECT * FROM transactions LIMIT 10;
