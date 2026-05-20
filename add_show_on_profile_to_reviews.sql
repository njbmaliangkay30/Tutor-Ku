-- Add show_on_profile column to reviews table
-- This allows tutors to toggle which reviews to show publicly on their profiles.
-- Default value is TRUE.

ALTER TABLE reviews 
ADD COLUMN IF NOT EXISTS show_on_profile BOOLEAN DEFAULT TRUE;
