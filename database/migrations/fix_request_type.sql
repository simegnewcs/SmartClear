-- Fix request_type ENUM to include all clearance reasons
-- Run this in MySQL to fix the "Data truncated" error for request_type

USE smartclear_db;

-- Add missing values to ENUM
ALTER TABLE clearance_requests 
  MODIFY request_type ENUM('graduation', 'withdrawal', 'education_leave', 'retirement', 'resignation', 
                          'end_of_academic_year', 'disciplinary', 'academic_dismissal', 'health_family') 
  NOT NULL;
