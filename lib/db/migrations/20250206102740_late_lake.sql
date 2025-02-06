/*
  # Set up deposit limits and update users

  1. Insert default Level 1 limit
    - Name: Level 1
    - Daily limit: 50,000 baht
    - Monthly limit: 50,000 baht
    - Created by admin user
*/

-- Insert Level 1 deposit limit
INSERT INTO deposit_limits (name, daily_limit, monthly_limit, created_by)
SELECT 'Level 1', 50000, 50000, id
FROM users 
WHERE email = 'ronnakritnook1@gmail.com'
ON CONFLICT DO NOTHING;

-- Update existing users to use Level 1 limit by default
UPDATE users
SET deposit_limit_id = (
  SELECT id FROM deposit_limits WHERE name = 'Level 1'
)
WHERE deposit_limit_id IS NULL;