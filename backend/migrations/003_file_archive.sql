ALTER TABLE files ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE files ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS files_deleted_at_idx ON files(deleted_at) WHERE deleted_at IS NOT NULL;
