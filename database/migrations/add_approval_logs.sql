-- Add approval_logs table for audit trail
-- Run this in MySQL to fix the missing table error

CREATE TABLE IF NOT EXISTS approval_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    request_id INT NOT NULL,
    node_name VARCHAR(100) NOT NULL,
    approver_id INT,
    approver_name VARCHAR(255),
    action ENUM('approved', 'rejected', 'correction_needed') NOT NULL,
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (request_id) REFERENCES clearance_requests(id) ON DELETE CASCADE,
    FOREIGN KEY (approver_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Add index for faster lookups
CREATE INDEX idx_approval_logs_request ON approval_logs(request_id);
CREATE INDEX idx_approval_logs_approver ON approval_logs(approver_id);
CREATE INDEX idx_approval_logs_created ON approval_logs(created_at);
