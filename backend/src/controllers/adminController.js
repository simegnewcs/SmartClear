const db = require('../config/db');

/**
 * @desc    Get ALL clearance requests (Student & Staff) - Super Admin Full View
 * Includes applicant type, full approval chain, and progress tracking
 * @route   GET /api/v1/admin/clearance-requests
 */
exports.getClearanceRequests = async (req, res) => {
    try {
        // Only Super Admin can access all data
        if (req.user && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Super Admin only.'
            });
        }

        const query = `
            SELECT 
                cr.id, 
                cr.request_type, 
                cr.status, 
                cr.started_at, 
                cr.completed_at,
                cr.initial_approval_status,
                cr.initial_approval_at,
                cr.approving_officer_name,
                u.full_name, 
                u.identifier_id,
                u.department_name,
                u.role as applicant_role,
                u.department,
                scn.*
            FROM clearance_requests cr
            JOIN users u ON cr.user_id = u.id
            LEFT JOIN staff_clearance_nodes scn ON cr.id = scn.request_id
            ORDER BY cr.started_at DESC
        `;
        
        const [requests] = await db.execute(query);

        // Process and categorize requests
        const processedRequests = requests.map(req => {
            // Determine applicant type
            const isStudent = req.applicant_role === 'student';
            const isStaff = req.applicant_role === 'staff' || req.applicant_role === 'department_head';
            
            // Calculate progress based on applicant type
            let progress = {};
            let approvalChain = [];
            
            if (isStudent) {
                // Student: 8 nodes (2 prerequisites + 6 offices)
                const studentNodes = [
                    { name: 'Batch Advisor', field: 'batch_advisor_status', status: req.batch_advisor_status },
                    { name: 'Chair Holder', field: 'chair_holder_status', status: req.chair_holder_status },
                    { name: 'Library', field: 'library_status', status: req.library_status },
                    { name: 'Sports', field: 'sports_status', status: req.sports_status },
                    { name: 'Book Store', field: 'book_store_status', status: req.book_store_status },
                    { name: 'Housing', field: 'housing_status', status: req.housing_status },
                    { name: 'Cafeteria', field: 'regular_budget_status', status: req.regular_budget_status },
                    { name: 'Registrar', field: 'registrar_status', status: req.registrar_status }
                ];
                
                const approved = studentNodes.filter(n => n.status === 'approved').length;
                progress = {
                    total: 8,
                    approved: approved,
                    percentage: Math.round((approved / 8) * 100)
                };
                approvalChain = studentNodes;
            } else if (isStaff) {
                // Staff: 21 nodes
                const staffNodes = [
                    { name: 'Supervisor', field: 'supervisor_status', status: req.supervisor_status },
                    { name: 'Regular Budget', field: 'regular_budget_status', status: req.regular_budget_status },
                    { name: 'Project Income', field: 'project_income_status', status: req.project_income_status },
                    { name: 'Fixed Asset', field: 'fixed_asset_status', status: req.fixed_asset_status },
                    { name: 'Library', field: 'library_status', status: req.library_status },
                    { name: 'Book Store', field: 'book_store_status', status: req.book_store_status },
                    { name: 'Sports', field: 'sports_status', status: req.sports_status },
                    { name: 'Credit Union', field: 'credit_union_status', status: req.credit_union_status },
                    { name: 'Ethics', field: 'ethics_status', status: req.ethics_status },
                    { name: 'Maintenance', field: 'maintenance_status', status: req.maintenance_status },
                    { name: 'Registrar', field: 'registrar_status', status: req.registrar_status },
                    { name: 'Housing', field: 'housing_status', status: req.housing_status },
                    { name: 'Revenue Dir', field: 'revenue_dir_status', status: req.revenue_dir_status },
                    { name: 'Lab/Workshop', field: 'lab_workshop_status', status: req.lab_workshop_status },
                    { name: 'Distance Edu', field: 'distance_edu_status', status: req.distance_edu_status },
                    { name: 'General Service', field: 'general_service_status', status: req.general_service_status },
                    { name: 'Staff Assoc', field: 'staff_assoc_status', status: req.staff_assoc_status },
                    { name: 'Central Property', field: 'central_property_status', status: req.central_property_status },
                    { name: 'Research', field: 'research_status', status: req.research_status },
                    { name: 'HR', field: 'hr_status', status: req.hr_status },
                    { name: 'Record Office', field: 'record_office_status', status: req.record_office_status }
                ];
                
                const approved = staffNodes.filter(n => n.status === 'approved').length;
                progress = {
                    total: 21,
                    approved: approved,
                    percentage: Math.round((approved / 21) * 100)
                };
                approvalChain = staffNodes;
            }

            return {
                id: req.id,
                request_type: req.request_type,
                status: req.status,
                started_at: req.started_at,
                completed_at: req.completed_at,
                applicant: {
                    full_name: req.full_name,
                    identifier_id: req.identifier_id,
                    department: req.department_name || req.department,
                    role: req.applicant_role,
                    type: isStudent ? 'Student' : (isStaff ? 'Staff' : 'Other')
                },
                initial_approval: {
                    status: req.initial_approval_status,
                    approved_at: req.initial_approval_at,
                    approved_by: req.approving_officer_name
                },
                progress,
                approval_chain: approvalChain,
                last_updated: req.last_updated
            };
        });

        res.status(200).json({
            success: true,
            count: processedRequests.length,
            data: processedRequests
        });
    } catch (error) {
        console.error("Database Join Error:", error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch clearance requests'
        });
    }
};
/**
 * @desc    Super Admin Dashboard Statistics
 * Comprehensive stats including role breakdown and approval analytics
 * @route   GET /api/v1/admin/stats
 */
exports.getDashboardStats = async (req, res) => {
    try {
        // Only Super Admin
        if (req.user && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Super Admin only.'
            });
        }

        // User counts by role
        const [totalStudents] = await db.execute('SELECT COUNT(*) as count FROM users WHERE role = "student"');
        const [totalStaff] = await db.execute('SELECT COUNT(*) as count FROM users WHERE role = "staff"');
        const [totalDeptHeads] = await db.execute('SELECT COUNT(*) as count FROM users WHERE role = "department_head"');
        const [totalGuards] = await db.execute('SELECT COUNT(*) as count FROM users WHERE role = "guard"');
        const [totalAdmins] = await db.execute('SELECT COUNT(*) as count FROM users WHERE role = "admin"');

        // Clearance request stats by status
        const [pendingRequests] = await db.execute('SELECT COUNT(*) as count FROM clearance_requests WHERE status = "pending"');
        const [inProgress] = await db.execute('SELECT COUNT(*) as count FROM clearance_requests WHERE status = "in_progress"');
        const [completedRequests] = await db.execute('SELECT COUNT(*) as count FROM clearance_requests WHERE status = "completed"');
        const [rejectedRequests] = await db.execute('SELECT COUNT(*) as count FROM clearance_requests WHERE status = "rejected"');

        // Student vs Staff clearance breakdown
        const [studentClearances] = await db.execute(`
            SELECT COUNT(*) as count 
            FROM clearance_requests cr 
            JOIN users u ON cr.user_id = u.id 
            WHERE u.role = "student"
        `);
        const [staffClearances] = await db.execute(`
            SELECT COUNT(*) as count 
            FROM clearance_requests cr 
            JOIN users u ON cr.user_id = u.id 
            WHERE u.role IN ("staff", "department_head")
        `);

        // Approval node performance - which offices are slow
        const [nodeStats] = await db.execute(`
            SELECT 
                AVG(CASE WHEN batch_advisor_status = 'approved' THEN 1 ELSE 0 END) as batch_advisor_rate,
                AVG(CASE WHEN chair_holder_status = 'approved' THEN 1 ELSE 0 END) as chair_holder_rate,
                AVG(CASE WHEN library_status = 'approved' THEN 1 ELSE 0 END) as library_rate,
                AVG(CASE WHEN registrar_status = 'approved' THEN 1 ELSE 0 END) as registrar_rate
            FROM staff_clearance_nodes scn
            JOIN clearance_requests cr ON scn.request_id = cr.id
            WHERE cr.status != 'rejected'
        `);

        res.status(200).json({
            success: true,
            stats: {
                users: {
                    totalStudents: totalStudents[0].count,
                    totalStaff: totalStaff[0].count,
                    totalDeptHeads: totalDeptHeads[0].count,
                    totalGuards: totalGuards[0].count,
                    totalAdmins: totalAdmins[0].count,
                    total: totalStudents[0].count + totalStaff[0].count + totalDeptHeads[0].count + totalGuards[0].count + totalAdmins[0].count
                },
                clearances: {
                    total: pendingRequests[0].count + inProgress[0].count + completedRequests[0].count + rejectedRequests[0].count,
                    pending: pendingRequests[0].count,
                    inProgress: inProgress[0].count,
                    completed: completedRequests[0].count,
                    rejected: rejectedRequests[0].count
                },
                byApplicantType: {
                    studentRequests: studentClearances[0].count,
                    staffRequests: staffClearances[0].count
                },
                nodeApprovalRates: nodeStats[0] || {}
            }
        });
    } catch (error) {
        console.error("Dashboard Stats Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Super Admin: Update any clearance request status and view full details
 * @route   PATCH /api/v1/admin/update-status/:id
 */
exports.updateRequestStatus = async (req, res) => {
    const { id } = req.params;
    const { status, remark, forceComplete } = req.body;

    try {
        // Only Super Admin
        if (req.user && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Super Admin only.'
            });
        }

        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            // Get request details
            const [requests] = await connection.execute(
                `SELECT cr.*, u.full_name, u.role, u.identifier_id 
                 FROM clearance_requests cr 
                 JOIN users u ON cr.user_id = u.id 
                 WHERE cr.id = ?`,
                [id]
            );

            if (requests.length === 0) {
                await connection.rollback();
                connection.release();
                return res.status(404).json({
                    success: false,
                    message: 'Clearance request not found'
                });
            }

            const request = requests[0];

            // Update clearance request status
            let updateQuery = 'UPDATE clearance_requests SET status = ?';
            let params = [status];

            if (status === 'completed') {
                updateQuery += ', completed_at = NOW()';
                // Generate QR code for completed clearances
                const qrData = JSON.stringify({
                    request_id: id,
                    user_id: request.user_id,
                    user_name: request.full_name,
                    identifier: request.identifier_id,
                    type: request.role === 'student' ? 'STUDENT' : 'STAFF',
                    cleared_at: new Date().toISOString(),
                    signature: 'SMARTCLEAR_DEVVOLTZ_2026'
                });
                updateQuery += ', final_qr_code = ?';
                params.push(Buffer.from(qrData).toString('base64'));
            }

            updateQuery += ' WHERE id = ?';
            params.push(id);

            await connection.execute(updateQuery, params);

            // Log admin action (audit trail)
            await connection.execute(
                `INSERT INTO admin_audit_logs (admin_id, action, target_type, target_id, details, created_at) 
                 VALUES (?, ?, ?, ?, ?, NOW())`,
                [req.user.id, 'UPDATE_STATUS', 'clearance_request', id, JSON.stringify({ status, remark })]
            );

            await connection.commit();
            connection.release();

            res.status(200).json({
                success: true,
                message: `Request ${status === 'completed' ? 'completed' : status} successfully`,
                data: {
                    request_id: id,
                    new_status: status,
                    processed_by: req.user.name,
                    processed_at: new Date().toISOString()
                }
            });
        } catch (error) {
            await connection.rollback();
            connection.release();
            throw error;
        }
    } catch (error) {
        console.error("Update Status Error:", error);
        res.status(500).json({ success: false, message: 'Failed to update status' });
    }
};

/**
 * @desc    Get detailed view of a single clearance with full approval chain
 * @route   GET /api/v1/admin/clearance-requests/:id/details
 */
exports.getClearanceDetails = async (req, res) => {
    const { id } = req.params;

    try {
        // Only Super Admin
        if (req.user && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Super Admin only.'
            });
        }

        // Get request with user details
        const [requests] = await db.execute(
            `SELECT 
                cr.*,
                u.full_name,
                u.identifier_id,
                u.email,
                u.phone,
                u.department_name,
                u.department,
                u.role as applicant_role,
                scn.*
             FROM clearance_requests cr
             JOIN users u ON cr.user_id = u.id
             LEFT JOIN staff_clearance_nodes scn ON cr.id = scn.request_id
             WHERE cr.id = ?`,
            [id]
        );

        if (requests.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Clearance request not found'
            });
        }

        const req = requests[0];
        const isStudent = req.applicant_role === 'student';
        const isStaff = req.applicant_role === 'staff' || req.applicant_role === 'department_head';

        // Build approval chain with approver info
        let approvalChain = [];
        
        if (isStudent) {
            const studentNodes = [
                { name: 'Batch Advisor', field: 'batch_advisor_status', status: req.batch_advisor_status, approver: null },
                { name: 'Chair Holder', field: 'chair_holder_status', status: req.chair_holder_status, approver: null },
                { name: 'Library', field: 'library_status', status: req.library_status, approver: null },
                { name: 'Sports', field: 'sports_status', status: req.sports_status, approver: null },
                { name: 'Book Store', field: 'book_store_status', status: req.book_store_status, approver: null },
                { name: 'Housing', field: 'housing_status', status: req.housing_status, approver: null },
                { name: 'Cafeteria', field: 'regular_budget_status', status: req.regular_budget_status, approver: null },
                { name: 'Registrar', field: 'registrar_status', status: req.registrar_status, approver: null }
            ];
            approvalChain = studentNodes;
        } else if (isStaff) {
            const staffNodes = [
                { name: 'Supervisor', field: 'supervisor_status', status: req.supervisor_status, order: 1 },
                { name: 'Regular Budget', field: 'regular_budget_status', status: req.regular_budget_status, order: 2 },
                { name: 'Project Income', field: 'project_income_status', status: req.project_income_status, order: 3 },
                { name: 'Fixed Asset', field: 'fixed_asset_status', status: req.fixed_asset_status, order: 4 },
                { name: 'Library', field: 'library_status', status: req.library_status, order: 5 },
                { name: 'Book Store', field: 'book_store_status', status: req.book_store_status, order: 6 },
                { name: 'Sports', field: 'sports_status', status: req.sports_status, order: 7 },
                { name: 'Credit Union', field: 'credit_union_status', status: req.credit_union_status, order: 8 },
                { name: 'Ethics', field: 'ethics_status', status: req.ethics_status, order: 9 },
                { name: 'Maintenance', field: 'maintenance_status', status: req.maintenance_status, order: 10 },
                { name: 'Registrar', field: 'registrar_status', status: req.registrar_status, order: 11 },
                { name: 'Housing', field: 'housing_status', status: req.housing_status, order: 12 },
                { name: 'Revenue Dir', field: 'revenue_dir_status', status: req.revenue_dir_status, order: 13 },
                { name: 'Lab/Workshop', field: 'lab_workshop_status', status: req.lab_workshop_status, order: 14 },
                { name: 'Distance Edu', field: 'distance_edu_status', status: req.distance_edu_status, order: 15 },
                { name: 'General Service', field: 'general_service_status', status: req.general_service_status, order: 16 },
                { name: 'Staff Assoc', field: 'staff_assoc_status', status: req.staff_assoc_status, order: 17 },
                { name: 'Central Property', field: 'central_property_status', status: req.central_property_status, order: 18 },
                { name: 'Research', field: 'research_status', status: req.research_status, order: 19 },
                { name: 'HR', field: 'hr_status', status: req.hr_status, order: 20 },
                { name: 'Record Office', field: 'record_office_status', status: req.record_office_status, order: 21 }
            ];
            approvalChain = staffNodes;
        }

        // Count approved/rejected/pending
        const approved = approvalChain.filter(n => n.status === 'approved').length;
        const rejected = approvalChain.filter(n => n.status === 'rejected').length;
        const pending = approvalChain.filter(n => n.status === 'pending').length;

        const detailedResponse = {
            request: {
                id: req.id,
                type: req.request_type,
                status: req.status,
                started_at: req.started_at,
                completed_at: req.completed_at,
                final_qr_code: req.final_qr_code
            },
            applicant: {
                full_name: req.full_name,
                identifier_id: req.identifier_id,
                email: req.email,
                phone: req.phone,
                department: req.department_name || req.department,
                role: req.applicant_role,
                type: isStudent ? 'Student' : (isStaff ? 'Staff' : 'Other')
            },
            initial_approval: {
                status: req.initial_approval_status,
                approved_by: req.approving_officer_name,
                approved_at: req.initial_approval_at,
                comments: req.initial_approval_comments
            },
            approval_chain: {
                nodes: approvalChain,
                summary: {
                    total: approvalChain.length,
                    approved: approved,
                    rejected: rejected,
                    pending: pending,
                    progress_percentage: Math.round((approved / approvalChain.length) * 100)
                }
            },
            audit_trail: {
                last_updated: req.last_updated,
                comments: req.comments
            }
        };

        res.status(200).json({
            success: true,
            data: detailedResponse
        });
    } catch (error) {
        console.error("Get Clearance Details Error:", error);
        res.status(500).json({ success: false, message: 'Failed to fetch clearance details' });
    }
};

/**
 * @desc    አዲስ ተጠቃሚ (Staff/Student) መመዝገብ
 * @route   POST /api/v1/admin/users
 */
exports.createUser = async (req, res) => {
    const { full_name, email, password, role, identifier_id, assigned_node } = req.body;

    try {
        const query = `
            INSERT INTO users (full_name, email, password, role, identifier_id, assigned_node) 
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        await db.execute(query, [full_name, email, password, role, identifier_id, assigned_node]);

        res.status(201).json({
            success: true,
            message: 'ተጠቃሚው በተሳካ ሁኔታ ተመዝግቧል'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'ምዝገባው አልተሳካም' });
    }
};

/**
 * @desc    Manage Approval Departments and Assign Approvers
 * @route   GET /api/v1/admin/departments
 */
exports.getDepartments = async (req, res) => {
    try {
        // Only Super Admin
        if (req.user && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Super Admin only.'
            });
        }

        // Get all staff members grouped by their assigned node
        const [staffByNode] = await db.execute(`
            SELECT 
                assigned_node,
                COUNT(*) as staff_count,
                GROUP_CONCAT(full_name SEPARATOR ', ') as staff_names
            FROM users 
            WHERE role = 'staff' AND assigned_node IS NOT NULL
            GROUP BY assigned_node
            ORDER BY assigned_node
        `);

        // Define all clearance nodes with their categories
        const allNodes = [
            // Student nodes (8)
            { id: 'batch_advisor_status', name: 'Batch Advisor', category: 'Student Academic', order: 1, is_student: true },
            { id: 'chair_holder_status', name: 'Chair Holder', category: 'Student Academic', order: 2, is_student: true },
            { id: 'library_status', name: 'Library', category: 'Student Services', order: 3, is_student: true },
            { id: 'sports_status', name: 'Sports', category: 'Student Services', order: 4, is_student: true },
            { id: 'book_store_status', name: 'Book Store', category: 'Student Services', order: 5, is_student: true },
            { id: 'housing_status', name: 'Housing', category: 'Student Services', order: 6, is_student: true },
            { id: 'regular_budget_status', name: 'Cafeteria', category: 'Student Finance', order: 7, is_student: true },
            { id: 'registrar_status', name: 'Registrar', category: 'Student Academic', order: 8, is_student: true },
            
            // Staff nodes (21 total, including the 8 above)
            { id: 'supervisor_status', name: 'Supervisor', category: 'Staff Management', order: 1, is_student: false },
            { id: 'project_income_status', name: 'Project Income', category: 'Staff Finance', order: 3, is_student: false },
            { id: 'credit_union_status', name: 'Credit Union', category: 'Staff Finance', order: 8, is_student: false },
            { id: 'revenue_dir_status', name: 'Revenue Director', category: 'Staff Finance', order: 13, is_student: false },
            { id: 'fixed_asset_status', name: 'Fixed Asset', category: 'Staff Assets', order: 4, is_student: false },
            { id: 'central_property_status', name: 'Central Property', category: 'Staff Assets', order: 18, is_student: false },
            { id: 'lab_workshop_status', name: 'Lab/Workshop', category: 'Staff Assets', order: 14, is_student: false },
            { id: 'ethics_status', name: 'Ethics', category: 'Staff Admin', order: 9, is_student: false },
            { id: 'maintenance_status', name: 'Maintenance', category: 'Staff Admin', order: 10, is_student: false },
            { id: 'staff_assoc_status', name: 'Staff Association', category: 'Staff Admin', order: 17, is_student: false },
            { id: 'distance_edu_status', name: 'Distance Education', category: 'Staff Admin', order: 15, is_student: false },
            { id: 'general_service_status', name: 'General Service', category: 'Staff Admin', order: 16, is_student: false },
            { id: 'research_status', name: 'Research', category: 'Staff Admin', order: 19, is_student: false },
            { id: 'hr_status', name: 'HR', category: 'Staff Admin', order: 20, is_student: false },
            { id: 'record_office_status', name: 'Record Office', category: 'Staff Admin', order: 21, is_student: false }
        ];

        // Map staff to nodes
        const departments = allNodes.map(node => {
            const staffAssignment = staffByNode.find(s => s.assigned_node === node.id);
            return {
                ...node,
                assigned_staff: staffAssignment ? {
                    count: staffAssignment.staff_count,
                    names: staffAssignment.staff_names.split(', ')
                } : null
            };
        });

        res.status(200).json({
            success: true,
            summary: {
                student_nodes: departments.filter(d => d.is_student).length,
                staff_only_nodes: departments.filter(d => !d.is_student).length,
                total_nodes: departments.length
            },
            data: departments
        });
    } catch (error) {
        console.error("Get Departments Error:", error);
        res.status(500).json({ success: false, message: 'Failed to fetch departments' });
    }
};

/**
 * @desc    Assign staff member to a specific approval node
 * @route   POST /api/v1/admin/assign-approver
 */
exports.assignApprover = async (req, res) => {
    const { user_id, assigned_node } = req.body;

    try {
        // Only Super Admin
        if (req.user && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Super Admin only.'
            });
        }

        // Validate node
        const validNodes = [
            'batch_advisor_status', 'chair_holder_status', 'library_status', 'sports_status',
            'book_store_status', 'housing_status', 'regular_budget_status', 'registrar_status',
            'supervisor_status', 'project_income_status', 'credit_union_status', 'revenue_dir_status',
            'fixed_asset_status', 'central_property_status', 'lab_workshop_status', 'ethics_status',
            'maintenance_status', 'staff_assoc_status', 'distance_edu_status', 'general_service_status',
            'research_status', 'hr_status', 'record_office_status'
        ];

        if (!validNodes.includes(assigned_node)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid node assignment'
            });
        }

        // Update user assignment
        await db.execute(
            'UPDATE users SET assigned_node = ? WHERE id = ?',
            [assigned_node, user_id]
        );

        // Log action
        await db.execute(
            `INSERT INTO admin_audit_logs (admin_id, action, target_type, target_id, details, created_at) 
             VALUES (?, ?, ?, ?, ?, NOW())`,
            [req.user.id, 'ASSIGN_APPROVER', 'user', user_id, JSON.stringify({ assigned_node })]
        );

        res.status(200).json({
            success: true,
            message: 'Approver assigned successfully'
        });
    } catch (error) {
        console.error("Assign Approver Error:", error);
        res.status(500).json({ success: false, message: 'Failed to assign approver' });
    }
};

/**
 * @desc    Get audit logs for admin actions
 * @route   GET /api/v1/admin/audit-logs
 */
exports.getAuditLogs = async (req, res) => {
    try {
        // Only Super Admin
        if (req.user && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Super Admin only.'
            });
        }

        const { limit = 50, offset = 0 } = req.query;

        // Check if audit_logs table exists, if not create it
        await db.execute(`
            CREATE TABLE IF NOT EXISTS admin_audit_logs (
                id INT PRIMARY KEY AUTO_INCREMENT,
                admin_id INT NOT NULL,
                action VARCHAR(100) NOT NULL,
                target_type VARCHAR(50),
                target_id INT,
                details TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (admin_id) REFERENCES users(id)
            )
        `);

        const [logs] = await db.execute(
            `SELECT 
                al.*,
                u.full_name as admin_name
             FROM admin_audit_logs al
             JOIN users u ON al.admin_id = u.id
             ORDER BY al.created_at DESC
             LIMIT ? OFFSET ?`,
            [parseInt(limit), parseInt(offset)]
        );

        res.status(200).json({
            success: true,
            count: logs.length,
            data: logs
        });
    } catch (error) {
        console.error("Get Audit Logs Error:", error);
        res.status(500).json({ success: false, message: 'Failed to fetch audit logs' });
    }
};

// Legacy: Get all staff clearance requests (for Admin)
exports.getStaffClearanceRequests = async (req, res) => {
  try {
    // Only Super Admin
    if (req.user && req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Super Admin only.'
        });
    }

    const query = `
      SELECT 
        cr.id, 
        cr.request_type, 
        cr.status, 
        cr.started_at,
        cr.completed_at,
        cr.initial_approval_status,
        u.full_name, 
        u.identifier_id,
        u.department,
        u.role
      FROM clearance_requests cr
      JOIN users u ON cr.user_id = u.id
      WHERE u.role IN ('staff', 'department_head')
      ORDER BY cr.started_at DESC
    `;
    
    const [requests] = await db.execute(query);

    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests
    });
  } catch (error) {
    console.error("Get Staff Requests Error:", error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch staff clearance requests'
    });
  }
};

// Legacy: Get staff dashboard stats
exports.getStaffDashboardStats = async (req, res) => {
  try {
    const [totalStaff] = await db.execute('SELECT COUNT(*) as count FROM users WHERE role IN ("staff", "department_head")');
    const [pending] = await db.execute(`
      SELECT COUNT(*) as count 
      FROM clearance_requests cr
      JOIN users u ON cr.user_id = u.id
      WHERE u.role IN ("staff", "department_head") AND cr.status = "pending"
    `);
    const [completed] = await db.execute(`
      SELECT COUNT(*) as count 
      FROM clearance_requests cr
      JOIN users u ON cr.user_id = u.id
      WHERE u.role IN ("staff", "department_head") AND cr.status = "completed"
    `);

    res.status(200).json({
      success: true,
      stats: {
        totalStaff: totalStaff[0].count,
        pendingRequests: pending[0].count,
        completedClearances: completed[0].count
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};