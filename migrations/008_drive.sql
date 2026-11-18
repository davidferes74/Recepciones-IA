-- Archivo en Google Drive: estado de subida de cada original y finalidad de cada autorización OAuth en curso.
ALTER TABLE ria_documents ADD COLUMN IF NOT EXISTS drive_file_id text;
ALTER TABLE ria_documents ADD COLUMN IF NOT EXISTS drive_name text;
ALTER TABLE ria_documents ADD COLUMN IF NOT EXISTS drive_state text;
ALTER TABLE ria_documents ADD COLUMN IF NOT EXISTS drive_at timestamptz;
ALTER TABLE ria_oauth_states ADD COLUMN IF NOT EXISTS purpose text NOT NULL DEFAULT 'gmail';
ALTER TABLE ria_oauth_states ADD COLUMN IF NOT EXISTS data jsonb;
