const db = require('../config/db');

/**
 * @desc    የተማሪውን የክሊራንስ ሁኔታ ከነሙሉ ዝርዝሩ ማግኘት
 * @route   GET /api/v1/student/status/:id
 */
exports.getStudentStatus = async (req, res) => {
    const studentId = req.params.id;

    try {
        // JOIN በመጠቀም ከተማሪው ጥያቄ ተነስተን የቢሮዎችን ሁኔታ መፈለግ
        const query = `
            SELECT cr.id as request_id, cr.status, cr.request_type, cr.started_at, scn.* 
            FROM clearance_requests cr
            JOIN staff_clearance_nodes scn ON cr.id = scn.request_id
            WHERE cr.user_id = ?
            ORDER BY cr.started_at DESC LIMIT 1
        `;

        const [rows] = await db.execute(query, [studentId]);

        if (rows.length === 0) {
            return res.json({ 
                success: true, 
                message: 'No active clearance request found',
                clearance: null,
                node_details: {} 
            });
        }

        const data = rows[0];
        
        // Create clearance object with request info
        const clearance = {
            id: data.request_id,
            status: data.status,
            request_type: data.request_type,
            started_at: data.started_at
        };
        
        // በ BIT ፎርም ላይ ያሉትን 8 ቢሮዎች (2 Prerequisite + 6 Offices) መለየት
        const studentNodes = {
            batch_advisor_status: data.batch_advisor_status,
            chair_holder_status: data.chair_holder_status,
            library_status: data.library_status,
            sports_status: data.sports_status,
            book_store_status: data.book_store_status,
            housing_status: data.housing_status,
            regular_budget_status: data.regular_budget_status, // Cafeteria
            registrar_status: data.registrar_status
        };

        // ፕሮግረሱን ማስላት (ከ 8ቱ ውስጥ ስንቱ ጸድቋል?)
        const totalRelevant = 8;
        let approvedCount = 0;
        Object.values(studentNodes).forEach(status => {
            if (status === 'approved') approvedCount++;
        });

        res.json({
            success: true,
            clearance: clearance,
            progress: {
                total: totalRelevant,
                approved: approvedCount,
                percentage: Math.round((approvedCount / totalRelevant) * 100)
            },
            node_details: studentNodes
        });

    } catch (error) {
        console.error("DATABASE ERROR:", error.message);
        res.status(500).json({ 
            success: false, 
            message: 'የሰርቨር ስህተት አጋጥሟል',
            error: error.message 
        });
    }
};

/**
 * @desc    አዲስ የክሊራንስ ጥያቄ ማቅረቢያ (BIT Sequential Workflow)
 * @route   POST /api/v1/student/apply
 */
exports.applyForClearance = async (req, res) => {
    const { user_id, request_type } = req.body;

    try {
        // 1. መጀመሪያ ጥያቄውን መመዝገብ
        const [requestResult] = await db.execute(
            'INSERT INTO clearance_requests (user_id, request_type, status) VALUES (?, ?, ?)',
            [user_id, request_type, 'pending']
        );

        const requestId = requestResult.insertId;

        // 2. � Sequential Workflow: Batch Advisor → Chair Holder → Others (Parallel)
        // Only Batch Advisor is unlocked initially
        const studentNodesQuery = `
            INSERT INTO staff_clearance_nodes (
                request_id, 
                batch_advisor_status,
                chair_holder_status,
                library_status, 
                sports_status, 
                book_store_status, 
                housing_status, 
                regular_budget_status, 
                registrar_status
            ) VALUES (
                ?, 
                'pending',      -- Batch Advisor: UNLOCKED (approve first)
                'locked',       -- Chair Holder: LOCKED (waits for batch advisor)
                'locked',       -- Library: LOCKED (waits for chair holder)
                'locked',       -- Sports: LOCKED (waits for chair holder)
                'locked',       -- Book Store: LOCKED (waits for chair holder)
                'locked',       -- Housing: LOCKED (waits for chair holder)
                'locked',       -- Cafeteria: LOCKED (waits for chair holder)
                'locked'        -- Registrar: LOCKED (waits for chair holder)
            )
        `;

        await db.execute(studentNodesQuery, [requestId]);

        res.status(201).json({ 
            success: true, 
            message: 'የ BIT ዲጂታል ክሊራንስ ጥያቄዎ በትክክል ተመዝግቧል! የመጀመሪያውን ማጽደቅ Batch Advisor ያከናውናል።',
            requestId: requestId,
            workflow: {
                step1: 'Batch Advisor (Unlocked)',
                step2: 'Chair Holder (Locked - unlocks after step 1)',
                step3: 'All Other 6 Offices (Parallel - unlock after step 2)'
            }
        });

    } catch (error) {
        console.error("APPLY ERROR:", error.message);
        res.status(500).json({ 
            success: false, 
            message: 'ጥያቄውን መላክ አልተቻለም',
            error: error.message 
        });
    }
};

/**
 * @desc    Approve student clearance node with sequential unlocking (BIT Workflow)
 *          Batch Advisor → Chair Holder → Others (Parallel)
 * @route   POST /api/v1/student/approve-node
 */
exports.approveStudentNode = async (req, res) => {
    const { request_id, node_name, action, remarks, approver_id, approver_name } = req.body;

    // Validate required fields
    if (!request_id || !node_name || !action) {
        return res.status(400).json({
            success: false,
            message: 'Missing required fields: request_id, node_name, action'
        });
    }

    // Valid student nodes
    const validStudentNodes = [
        'batch_advisor_status',
        'chair_holder_status', 
        'library_status',
        'sports_status',
        'book_store_status',
        'housing_status',
        'regular_budget_status',
        'registrar_status'
    ];

    if (!validStudentNodes.includes(node_name)) {
        return res.status(400).json({
            success: false,
            message: `Invalid node name. Valid nodes: ${validStudentNodes.join(', ')}`
        });
    }

    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
        // 1. Get current node status
        const [nodeStatus] = await connection.execute(
            `SELECT ${node_name} as status FROM staff_clearance_nodes WHERE request_id = ?`,
            [request_id]
        );

        if (nodeStatus.length === 0) {
            await connection.rollback();
            connection.release();
            return res.status(404).json({
                success: false,
                message: 'Clearance request not found'
            });
        }

        if (nodeStatus[0].status === 'locked') {
            await connection.rollback();
            connection.release();
            return res.status(403).json({
                success: false,
                message: 'This node is locked. Complete previous approvals first.',
                status: 'locked'
            });
        }

        if (nodeStatus[0].status !== 'pending') {
            await connection.rollback();
            connection.release();
            return res.status(400).json({
                success: false,
                message: `This request has already been ${nodeStatus[0].status}`
            });
        }

        // 2. Update the approved node
        await connection.execute(
            `UPDATE staff_clearance_nodes 
             SET ${node_name} = ?, 
                 comments = CONCAT(IFNULL(comments, ''), '\n[${approver_name}]: ', ?),
                 last_updated = CURRENT_TIMESTAMP
             WHERE request_id = ?`,
            [action, remarks || 'No remarks', request_id]
        );

        // 3. 🔓 UNLOCK LOGIC: Unlock next node(s) based on current approval
        let unlockedNodes = [];

        if (node_name === 'batch_advisor_status' && action === 'approved') {
            // Batch Advisor approved → Unlock Chair Holder
            await connection.execute(
                `UPDATE staff_clearance_nodes 
                 SET chair_holder_status = 'pending'
                 WHERE request_id = ? AND chair_holder_status = 'locked'`,
                [request_id]
            );
            unlockedNodes.push('chair_holder_status');

        } else if (node_name === 'chair_holder_status' && action === 'approved') {
            // Chair Holder approved → Unlock ALL remaining 6 nodes (parallel)
            await connection.execute(
                `UPDATE staff_clearance_nodes 
                 SET library_status = 'pending',
                     sports_status = 'pending',
                     book_store_status = 'pending',
                     housing_status = 'pending',
                     regular_budget_status = 'pending',
                     registrar_status = 'pending'
                 WHERE request_id = ?`,
                [request_id]
            );
            unlockedNodes.push(
                'library_status',
                'sports_status',
                'book_store_status',
                'housing_status',
                'regular_budget_status',
                'registrar_status'
            );
        }

        // 4. Log the approval action
        await connection.execute(
            `INSERT INTO approval_logs 
             (request_id, node_name, approver_id, approver_name, action, remarks, created_at)
             VALUES (?, ?, ?, ?, ?, ?, NOW())`,
            [request_id, node_name, approver_id || null, approver_name || 'Unknown', action, remarks || null]
        );

        // 5. Check if all 8 nodes are approved (for completion)
        const [allNodes] = await connection.execute(
            `SELECT batch_advisor_status, chair_holder_status, library_status, 
                    sports_status, book_store_status, housing_status, 
                    regular_budget_status, registrar_status
             FROM staff_clearance_nodes WHERE request_id = ?`,
            [request_id]
        );

        const node = allNodes[0];
        const allApproved = 
            node.batch_advisor_status === 'approved' &&
            node.chair_holder_status === 'approved' &&
            node.library_status === 'approved' &&
            node.sports_status === 'approved' &&
            node.book_store_status === 'approved' &&
            node.housing_status === 'approved' &&
            node.regular_budget_status === 'approved' &&
            node.registrar_status === 'approved';

        if (allApproved) {
            await connection.execute(
                'UPDATE clearance_requests SET status = "completed", completed_at = NOW() WHERE id = ?',
                [request_id]
            );
        }

        await connection.commit();
        connection.release();

        res.json({
            success: true,
            message: action === 'approved' ? 'Request approved successfully!' : 'Request rejected',
            data: {
                request_id,
                node: node_name,
                action,
                processed_by: approver_name,
                unlocked_nodes: unlockedNodes,
                all_approved: allApproved,
                workflow_status: allApproved ? 'COMPLETED' : 'IN_PROGRESS'
            }
        });

    } catch (error) {
        await connection.rollback();
        connection.release();
        console.error("Approve Node Error:", error);
        res.status(500).json({
            success: false,
            message: 'Failed to process approval',
            error: error.message
        });
    }
};