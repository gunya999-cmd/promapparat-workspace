CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique_lower ON users (lower(email));
