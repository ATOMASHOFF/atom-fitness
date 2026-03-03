-- Migration script to add gym QR functionality
-- Run this if you already have the old system

-- Enable UUID extension (required)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create gym QR codes table
CREATE TABLE IF NOT EXISTS gym_qr_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token VARCHAR(255) UNIQUE NOT NULL,
    qr_image_data TEXT NOT NULL,
    location VARCHAR(100) DEFAULT 'Main Entrance',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add gym_qr_id column to attendance_logs if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'attendance_logs' 
        AND column_name = 'gym_qr_id'
    ) THEN
        ALTER TABLE attendance_logs 
        ADD COLUMN gym_qr_id UUID REFERENCES gym_qr_codes(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Add index for gym QR lookups
CREATE INDEX IF NOT EXISTS idx_gym_qr_token ON gym_qr_codes(token);
CREATE INDEX IF NOT EXISTS idx_gym_qr_active ON gym_qr_codes(is_active);

-- Add trigger for updated_at
CREATE TRIGGER update_gym_qr_updated_at BEFORE UPDATE ON gym_qr_codes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

SELECT 'Migration completed successfully!' as status;
