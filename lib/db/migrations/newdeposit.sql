-- Add deposit_limit_id to users if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'deposit_limit_id'
  ) THEN
    ALTER TABLE users ADD COLUMN deposit_limit_id integer REFERENCES deposit_limits(id);
  END IF;
END $$;

-- Insert Level 1 deposit limit if it doesn't exist
INSERT INTO deposit_limits (name, daily_limit, monthly_limit, created_by)
SELECT 'Level 1', 50000, 50000, id
FROM users 
WHERE email = 'ronnakritnook1@gmail.com'
AND NOT EXISTS (
  SELECT 1 FROM deposit_limits WHERE name = 'Level 1'
)
ON CONFLICT DO NOTHING;

-- Update existing users to use Level 1 limit by default
UPDATE users
SET deposit_limit_id = (
  SELECT id FROM deposit_limits WHERE name = 'Level 1'
)
WHERE deposit_limit_id IS NULL;
