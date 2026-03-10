-- Add coordinates to point_of_interest for radius-based search
ALTER TABLE point_of_interest ADD COLUMN latitude DECIMAL(10, 7);
ALTER TABLE point_of_interest ADD COLUMN longitude DECIMAL(10, 7);
