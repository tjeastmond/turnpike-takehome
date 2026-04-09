-- Load scripts/stmt.csv (summary lines + blank line, then header row). Run from repo root:
--   duckdb scripts/transactions.duckdb -f scripts/create_duckdb_table.sql

CREATE OR REPLACE TABLE transactions AS
SELECT
    ROW_NUMBER() OVER () AS line_number,
    strftime(t."Date", '%m/%d/%Y') AS date,
    t."Description" AS description,
    TRY_CAST(REPLACE(REPLACE(t."Amount", '"', ''), ',', '') AS DECIMAL(10, 2)) AS amount,
    TRY_CAST(REPLACE(REPLACE(t."Running Bal.", '"', ''), ',', '') AS DECIMAL(10, 2)) AS running_bal,
    FALSE AS deductible,
    CAST(NULL AS VARCHAR) AS category,
    CAST(NULL AS VARCHAR) AS name
FROM (
        SELECT *
        FROM read_csv_auto(
                'scripts/stmt.csv',
                skip = 6,
                header = true,
                ignore_errors = false
            ) AS r
        WHERE
            r."Date" IS NOT NULL
            AND r."Description" IS NOT NULL
            AND trim(r."Description") != ''
    ) AS t;

-- Display the table structure
DESCRIBE transactions;

-- Show first few rows
SELECT * FROM transactions LIMIT 10;
