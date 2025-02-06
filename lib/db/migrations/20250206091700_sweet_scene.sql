/*
  # Add deposit limits table

  1. New Tables
    - `deposit_limits`
      - `id` (serial, primary key)
      - `name` (varchar) - Level name
      - `daily_limit` (decimal) - Daily deposit limit amount
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

-- Insert default level 1
INSERT INTO deposit_limits (name, daily_limit, created_by)
SELECT 'Level 1', 10000, id
FROM users 
WHERE email = 'ronnakritnook1@gmail.com'
ON CONFLICT DO NOTHING;