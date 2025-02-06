/*
  # Add deposit limits management

  1. New Tables
    - `deposit_limits`
      - `id` (serial, primary key)
      - `name` (varchar) - Level name (e.g., "Bronze", "Silver", "Gold")
      - `daily_limit` (decimal) - Maximum daily deposit amount
      - `monthly_limit` (decimal) - Maximum monthly deposit amount
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `created_by` (integer, foreign key) - Admin who created the limit
*/

CREATE TABLE IF NOT EXISTS deposit_limits (
  id serial PRIMARY KEY NOT NULL,
  name varchar(50) NOT NULL,
  daily_limit decimal NOT NULL,
  monthly_limit decimal NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by integer REFERENCES users(id)
);

-- Enable RLS
ALTER TABLE deposit_limits ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access
CREATE POLICY "Admins can manage deposit limits"
  ON deposit_limits
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');