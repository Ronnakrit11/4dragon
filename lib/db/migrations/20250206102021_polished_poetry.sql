/*
  # Add deposit limit ID to users table

  1. Changes
    - Add deposit_limit_id column to users table
    - Add foreign key reference to deposit_limits table
*/

ALTER TABLE users 
ADD COLUMN deposit_limit_id integer REFERENCES deposit_limits(id);