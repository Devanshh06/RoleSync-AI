-- Add columns for Gmail IMAP integration
ALTER TABLE staff 
ADD COLUMN IF NOT EXISTS gmail_address TEXT,
ADD COLUMN IF NOT EXISTS gmail_app_password TEXT;
