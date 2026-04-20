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
            SELECT scn.* FROM clearance_requests cr
            JOIN staff_clearance_nodes scn ON cr.id = scn.request_id
            WHERE cr.user_id = ?
            ORDER BY cr.started_at DESC LIMIT 1
        `;

        const [rows] = await db.execute(query, [studentId]);

        if (rows.length === 0) {
            return res.json({ 
                success: true, 
                message: 'No active clearance request found',
                node_details: {} 
            });
        }

        const data = rows[0];
        
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

        // 2. 🔴 8ቱን ቢሮዎች ብቻ 'pending' በማድረግ መክፈት
        // Batch Advisor እና Chair Holder መጀመሪያ ይገባሉ
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
            ) VALUES (?, 'pending', 'pending', 'pending', 'pending', 'pending', 'pending', 'pending', 'pending')
        `;

        await db.execute(studentNodesQuery, [requestId]);

        res.status(201).json({ 
            success: true, 
            message: 'የ BIT ዲጂታል ክሊራንስ ጥያቄዎ በትክክል ተመዝግቧል!',
            requestId: requestId
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