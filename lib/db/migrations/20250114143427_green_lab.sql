/*
  # Add transactions table for tracking buy/sell history

  1. New Tables
    - `transactions`
      - `id` (serial, primary key)
      - `user_id` (integer, foreign key)
      - `gold_type` (varchar)
      - `amount` (decimal)
      - `price_per_unit` (decimal)
      - `total_price` (decimal) 
      - `type` (varchar) - 'buy' or 'sell'
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `transactions` table
    - Add policy for users to read their own transactions
*/

CREATE TABLE IF NOT EXISTS "transactions" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL REFERENCES users(id),
  "gold_type" varchar(50) NOT NULL,
  "amount" decimal NOT NULL,
  "price_per_unit" decimal NOT NULL,
  "total_price" decimal NOT NULL,
  "type" varchar(10) NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own transactions"
  ON transactions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);