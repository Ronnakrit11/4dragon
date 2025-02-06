/*
  # Add deposit limits table

  1. New Tables
    - `deposit_limits`
      - `id` (serial, primary key)
      - `name` (varchar) - Name of the limit level
      - `daily_limit` (decimal) - Daily deposit limit amount
      - `monthly_limit` (decimal) - Monthly deposit limit amount
      - `created_by` (integer, foreign key) - Admin who created the limit
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `deposit_limits` table
    - Add policy for admin access
*/

CREATE TABLE IF NOT EXISTS deposit_limits (
  id serial PRIMARY KEY,
  name varchar(100) NOT NULL,
  daily_limit decimal NOT NULL,
  monthly_limit decimal NOT NULL,
  created_by integer NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE deposit_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage deposit limits"
  ON deposit_limits
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');