-- Add Chair Holder for Student Clearance Workflow
-- The Chair Holder approves after Batch Advisor in the sequential workflow

INSERT INTO users (full_name, identifier_id, password, role, department, email, assigned_node) 
VALUES 
('Prof. Tadesse Alemu', 'CHAIR_01', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'staff', 'Computer Science', 'chair@smartclear.edu', 'chair_holder_status'),
('Dr. Almaz Bekele', 'CHAIR_02', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'staff', 'Software Engineering', 'chair2@smartclear.edu', 'chair_holder_status'),
('Prof. Yonas Girma', 'CHAIR_03', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'staff', 'Information Technology', 'chair3@smartclear.edu', 'chair_holder_status');

-- Password for all: 'password123' (bcrypt hashed)
