const db = require('../config/db');

/**
/**
 * @desc    ሁሉንም የክሊራንስ ጥያቄዎች ከተማሪ መረጃ ጋር ማምጣት
 * @route   GET /api/v1/admin/clearance-requests
 */
exports.getClearanceRequests = async (req, res) => {
    try {
        // SQL Query ማብራሪያ፡
        // 1. 'cr.user_id' በ 'users.id' በኩል እናገናኘዋለን
        // 2. የተማሪውን ስም (full_name) እና መለያ ቁጥር (identifier_id) እናመጣለን
        const query = `
            SELECT 
                cr.id, 
                cr.request_type, 
                cr.status, 
                cr.started_at, 
                u.full_name, 
                u.identifier_id,
                u.department_name
            FROM clearance_requests cr
            JOIN users u ON cr.user_id = u.id
            ORDER BY cr.started_at DESC
        `;
        
        const [requests] = await db.execute(query);

        res.status(200).json({
            success: true,
            count: requests.length,
            data: requests
        });
    } catch (error) {
        console.error("Database Join Error:", error);
        res.status(500).json({
            success: false,
            message: 'የክሊራንስ መረጃዎችን ማምጣት አልተቻለም'
        });
    }
};
/**
 * @desc    የዳሽቦርድ አጠቃላይ ስታቲስቲክስ (Cards)
 * @route   GET /api/v1/admin/stats
 */
exports.getDashboardStats = async (req, res) => {
    try {
        // ጠቅላላ ተማሪ፣ በመጠባበቅ ላይ ያሉ ጥያቄዎች እና ያለቁ ክሊራንሶች
        const [totalStudents] = await db.execute('SELECT COUNT(*) as count FROM users WHERE role = "student"');
        const [pending] = await db.execute('SELECT COUNT(*) as count FROM clearance_requests WHERE status = "pending"');
        const [completed] = await db.execute('SELECT COUNT(*) as count FROM clearance_requests WHERE status = "completed"');

        res.status(200).json({
            success: true,
            stats: {
                totalStudents: totalStudents[0].count,
                pendingRequests: pending[0].count,
                completedClearances: completed[0].count
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    አንድን የክሊራንስ ጥያቄ ማጽደቅ ወይም ውድቅ ማድረግ
 * @route   PATCH /api/v1/admin/update-status/:id
 */
exports.updateRequestStatus = async (req, res) => {
    const { id } = req.params;
    const { status, remark } = req.body;

    try {
        const query = 'UPDATE clearance_requests SET status = ?, remark = ?, updated_at = NOW() WHERE id = ?';
        await db.execute(query, [status, remark || '', id]);

        res.status(200).json({
            success: true,
            message: `ጥያቄው በተሳካ ሁኔታ ${status === 'approved' ? 'ጸድቋል' : 'ተሰርዟል'}`
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'ሁኔታውን መቀየር አልተቻለም' });
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