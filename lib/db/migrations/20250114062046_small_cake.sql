/*
  # Add balance tracking system

  1. New Tables
    - `user_balances`
      - `id` (serial, primary key)
      - `user_id` (integer, foreign key) - References users table
      - `balance` (decimal) - Current balance amount
      - `updated_at` (timestamp) - Last update timestamp

  2. Security
    - Enable RLS on `user_balances` table
    - Add policy for users to read their own balance
*/

CREATE TABLE IF NOT EXISTS "user_balances" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer REFERENCES users(id) NOT NULL UNIQUE,
  "balance" decimal NOT NULL DEFAULT 0,
  "updated_at" timestamp NOT NULL DEFAULT now()
);

ALTER TABLE user_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own balance"
  ON user_balances
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);