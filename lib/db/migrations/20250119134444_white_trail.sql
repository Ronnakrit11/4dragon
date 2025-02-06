/*
  # Add bank accounts table

  1. New Tables
    - `bank_accounts`
      - `id` (serial, primary key)
      - `user_id` (integer, foreign key)
      - `bank` (varchar)
      - `account_number` (varchar)
      - `account_name` (varchar)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `bank_accounts` table
    - Add policy for users to manage their own bank accounts
*/

CREATE TABLE IF NOT EXISTS bank_accounts (
  id serial PRIMARY KEY,
  user_id integer NOT NULL REFERENCES users(id),
  bank varchar(50) NOT NULL,
  account_number varchar(20) NOT NULL,
  account_name varchar(100) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own bank accounts"
  ON bank_accounts
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);