const db = require('../config/db');

// 1. ክሊራንስ ማስጀመር (Initiate)
exports.initiateStaffClearance = async (req, res) => {
    const { user_id, request_type } = req.body; 

    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
        // ቀድሞ የተጀመረና ያላለቀ ጥያቄ ካለ ቼክ ማድረግ
        const [existing] = await connection.execute(
            'SELECT * FROM clearance_requests WHERE user_id = ? AND status NOT IN ("completed", "rejected")',
            [user_id]
        );

        if (existing.length > 0) {
            return res.status(400).json({ message: 'አሁንም በሂደት ላይ ያለ ጥያቄ አለዎት።' });
        }

        // አዲስ ጥያቄ መመዝገብ (እንደ dump ፋይሉ 'pending' default ነው)
        const [requestResult] = await connection.execute(
            'INSERT INTO clearance_requests (user_id, request_type, status) VALUES (?, ?, "pending")',
            [user_id, request_type]
        );

        const requestId = requestResult.insertId;

        // ለ 21ዱ ቢሮዎች ኖድ (Nodes) መፍጠር
        await connection.execute(
            'INSERT INTO staff_clearance_nodes (request_id) VALUES (?)',
            [requestId]
        );

        await connection.commit();
        res.status(201).json({
            success: true,
            message: 'የክሊራንስ ጥያቄዎ በተሳካ ሁኔታ ተጀምሯል።',
            requestId: requestId
        });

    } catch (error) {
        await connection.rollback();
        console.error("Initiate Error:", error);
        res.status(500).json({ message: 'ጥያቄውን ማስጀመር አልተቻለም።' });
    } finally {
        connection.release();
    }
};

// 2. የቢሮ ሁኔታን ማዘመን (Update Node)
exports.updateNodeStatus = async (req, res) => {
    const { request_id, column_name, status, comments } = req.body;

    // ካንተ የ SQL Dump የወጡ ትክክለኛ የኮለም ስሞች
    const validColumns = [
        'regular_budget_status', 'project_income_status', 'credit_union_status', 
        'revenue_dir_status', 'fixed_asset_status', 'library_status', 
        'book_store_status', 'central_property_status', 'lab_workshop_status',
        'hr_status', 'record_office_status', 'ethics_status', 'staff_assoc_status',
        'registrar_status', 'maintenance_status', 'housing_status', 
        'research_status', 'sports_status', 'distance_edu_status', 
        'general_service_status', 'supervisor_status'
    ];

    if (!validColumns.includes(column_name)) {
        return res.status(400).json({ message: 'ልክ ያልሆነ የቢሮ ስም ነው።' });
    }

    try {
        const query = `
            UPDATE staff_clearance_nodes 
            SET ${column_name} = ?, comments = ? 
            WHERE request_id = ?
        `;
        
        const [result] = await db.execute(query, [status, comments || null, request_id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'የክሊራንስ ጥያቄው አልተገኘም።' });
        }

        res.json({ success: true, message: `ቢሮው በ ${status} ሁኔታ ተመዝግቧል።` });

    } catch (error) {
        console.error("Update Node Error:", error);
        res.status(500).json({ message: 'ማዘመን አልተቻለም።' });
    }
};

// 3. የሂደት ሁኔታን ማግኘት (Get Progress) - ለሞባይል አፕ
exports.getClearanceProgress = async (req, res) => {
    const { user_id } = req.params;

    try {
        const query = `
            SELECT r.id as request_id, r.status as overall_status, r.started_at, n.*
            FROM clearance_requests r
            JOIN staff_clearance_nodes n ON r.id = n.request_id
            WHERE r.user_id = ? 
            ORDER BY r.started_at DESC LIMIT 1
        `;

        const [rows] = await db.execute(query, [user_id]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'ምንም የክሊራንስ ጥያቄ አልተገኘም።' });
        }

        const data = rows[0];
        const nodeColumns = [
            'regular_budget_status', 'project_income_status', 'credit_union_status', 
            'revenue_dir_status', 'fixed_asset_status', 'library_status', 
            'book_store_status', 'central_property_status', 'lab_workshop_status',
            'hr_status', 'record_office_status', 'ethics_status', 'staff_assoc_status',
            'registrar_status', 'maintenance_status', 'housing_status', 
            'research_status', 'sports_status', 'distance_edu_status', 
            'general_service_status', 'supervisor_status'
        ];

        let approvedCount = 0;
        const details = {};

        nodeColumns.forEach(node => {
            details[node] = data[node];
            if (data[node] === 'approved') approvedCount++;
        });

        const percentage = Math.round((approvedCount / nodeColumns.length) * 100);

        res.json({
            request_id: data.request_id,
            overall_status: data.overall_status,
            started_at: data.started_at,
            progress: {
                total_nodes: nodeColumns.length,
                approved_nodes: approvedCount,
                percentage: percentage
            },
            node_details: details
        });

    } catch (error) {
        console.error("Get Progress Error:", error);
        res.status(500).json({ message: 'መረጃውን ማግኘት አልተቻለም።' });
    }
};

// 4. የመጨረሻ QR ማመንጨት
exports.generateFinalQR = async (req, res) => {
    const { request_id } = req.params;

    try {
        const [rows] = await db.execute('SELECT * FROM staff_clearance_nodes WHERE request_id = ?', [request_id]);
        if (rows.length === 0) return res.status(404).json({ message: "ጥያቄው አልተገኘም" });

        const node = rows[0];
        const nodeColumns = [
            'regular_budget_status', 'project_income_status', 'credit_union_status', 
            'revenue_dir_status', 'fixed_asset_status', 'library_status', 
            'book_store_status', 'central_property_status', 'lab_workshop_status',
            'hr_status', 'record_office_status', 'ethics_status', 'staff_assoc_status',
            'registrar_status', 'maintenance_status', 'housing_status', 
            'research_status', 'sports_status', 'distance_edu_status', 
            'general_service_status', 'supervisor_status'
        ];

        const allApproved = nodeColumns.every(col => node[col] === 'approved');

        if (!allApproved) {
            const approvedCount = nodeColumns.filter(col => node[col] === 'approved').length;
            return res.status(400).json({ 
                message: "ገና አልተጠናቀቀም", 
                pending: nodeColumns.length - approvedCount 
            });
        }

        const qrPayload = {
            rid: request_id,
            v: "DEVVOLTZ_SECURE_v1",
            ts: new Date().toISOString()
        };

        res.json({
            success: true,
            qr_string: JSON.stringify(qrPayload),
            message: "ዲጂታል ፊርማዎ ዝግጁ ነው!"
        });

    } catch (error) {
        console.error("QR Error:", error);
        res.status(500).json({ message: "ስህተት አጋጥሟል" });
    }
};



// ለቢሮ ሀላፊዎች የሚጠባበቁ ተማሪዎችን ዝርዝር ማምጫ
exports.getPendingStudents = async (req, res) => {
    const { node_name } = req.query; // ለምሳሌ 'library', 'batch_advisor'

    try {
        // የደህንነት ጥበቃ፡ node_name ባዶ ካልሆነና በሲስተሙ የታወቀ መሆኑን ቼክ ማድረግ የተሻለ ነው
        if (!node_name) {
            return res.status(400).json({ success: false, message: 'Node name is required' });
        }

        const query = `
            SELECT 
                cr.id as request_id, 
                u.full_name, 
                u.student_id, 
                cr.request_type, 
                scn.${node_name}_status as status,
                cr.started_at
            FROM clearance_requests cr
            JOIN users u ON cr.user_id = u.id
            JOIN staff_clearance_nodes scn ON cr.id = scn.request_id
            WHERE scn.${node_name}_status = 'pending'
        `;

        const [rows] = await db.execute(query);
        res.json({ success: true, students: rows });

    } catch (error) {
        console.error("Staff Fetch Error:", error.message);
        res.status(500).json({ success: false, message: 'ዳታ ማምጣት አልተቻለም' });
    }
};

// የተማሪውን ሁኔታ ማጽደቂያ ወይም መከልከያ (Approve/Reject)
exports.updateNodeStatus = async (req, res) => {
    const { request_id, node_name, status } = req.body;

    try {
        const query = `
            UPDATE staff_clearance_nodes 
            SET ${node_name}_status = ?, updated_at = CURRENT_TIMESTAMP 
            WHERE request_id = ?
        `;

        await db.execute(query, [status, request_id]);
        res.json({ success: true, message: `Status updated to ${status}` });

    } catch (error) {
        console.error("Update Error:", error.message);
        res.status(500).json({ success: false, message: 'ማዘመን አልተቻለም' });
    }
};


exports.getPendingApprovals = async (req, res) => {
    const { node_name } = req.query; // ለምሳሌ: library_status, sports_status

    if (!node_name) {
        return res.status(400).json({ success: false, message: "Node name is required" });
    }

    try {
        // ሰራተኛው ባተመደበበት ቢሮ 'pending' የሆኑትን ብቻ ማምጣት
        const query = `
            SELECT cr.id as request_id, u.full_name, u.identifier_id, cr.request_type, sn.id as node_id
            FROM clearance_requests cr
            JOIN users u ON cr.user_id = u.id
            JOIN staff_clearance_nodes sn ON cr.id = sn.request_id
            WHERE sn.${node_name} = 'pending'
        `;
        
        const [requests] = await db.execute(query);
        res.status(200).json({ success: true, data: requests });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.approveNode = async (req, res) => {
    const { node_id, node_name, status, comments } = req.body;
    try {
        const query = `UPDATE staff_clearance_nodes SET ${node_name} = ?, comments = ? WHERE id = ?`;
        await db.execute(query, [status, comments || '', node_id]);
        res.status(200).json({ success: true, message: "በተሳካ ሁኔታ ጸድቋል" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};