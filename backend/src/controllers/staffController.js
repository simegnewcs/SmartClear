// backend/src/controllers/staffController.js
const db = require('../config/db');

// 21 Staff Clearance Nodes based on official form
const STAFF_NODES = [
  'supervisor_status',
  'regular_budget_status',
  'project_income_status',
  'fixed_asset_status',
  'library_status',
  'book_store_status',
  'sports_status',
  'credit_union_status',
  'ethics_status',
  'maintenance_status',
  'registrar_status',
  'housing_status',
  'revenue_dir_status',
  'lab_workshop_status',
  'distance_edu_status',
  'general_service_status',
  'staff_assoc_status',
  'central_property_status',
  'research_status',
  'hr_status',
  'record_office_status'
];

// 1. Initiate Staff Clearance
exports.initiateStaffClearance = async (req, res) => {
  const { user_id, request_type, personal_info } = req.body;

  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    // Check for existing pending request
    const [existing] = await connection.execute(
      'SELECT * FROM clearance_requests WHERE user_id = ? AND status NOT IN ("completed", "rejected")',
      [user_id]
    );

    if (existing.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'You already have a pending clearance request' 
      });
    }

    // Update staff personal info if provided
    if (personal_info) {
      await connection.execute(
        `UPDATE users SET 
          father_name = ?, 
          grandfather_name = ?, 
          position = ?, 
          department = ?
        WHERE id = ?`,
        [
          personal_info.father_name || null,
          personal_info.grandfather_name || null,
          personal_info.position || null,
          personal_info.department || null,
          user_id
        ]
      );
    }

    // Create new clearance request
    const [requestResult] = await connection.execute(
      'INSERT INTO clearance_requests (user_id, request_type, status) VALUES (?, ?, "pending")',
      [user_id, request_type]
    );

    const requestId = requestResult.insertId;

    // Insert all 21 nodes as pending
    const nodeColumns = STAFF_NODES.join(', ');
    const nodePlaceholders = STAFF_NODES.map(() => 'pending').join(', ');
    
    await connection.execute(
      `INSERT INTO staff_clearance_nodes (request_id, ${nodeColumns}) VALUES (?, ${nodePlaceholders})`,
      [requestId]
    );

    await connection.commit();
    
    res.status(201).json({
      success: true,
      message: 'Staff clearance request initiated successfully',
      requestId: requestId
    });

  } catch (error) {
    await connection.rollback();
    console.error("Initiate Staff Clearance Error:", error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to initiate clearance request' 
    });
  } finally {
    connection.release();
  }
};

// 2. Update Node Status (for Staff workflow)
exports.updateStaffNodeStatus = async (req, res) => {
  const { request_id, column_name, status, comments, approved_by } = req.body;

  if (!STAFF_NODES.includes(column_name)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Invalid office name' 
    });
  }

  try {
    const query = `
      UPDATE staff_clearance_nodes 
      SET ${column_name} = ?, 
          comments = ?, 
          approved_by = ?,
          last_updated = CURRENT_TIMESTAMP
      WHERE request_id = ?
    `;
    
    const [result] = await db.execute(query, [status, comments || null, approved_by || null, request_id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Clearance request not found' 
      });
    }

    // Check if all nodes are approved
    const [allNodes] = await db.execute(
      `SELECT ${STAFF_NODES.join(', ')} FROM staff_clearance_nodes WHERE request_id = ?`,
      [request_id]
    );

    if (allNodes.length > 0) {
      const allApproved = STAFF_NODES.every(node => allNodes[0][node] === 'approved');
      
      if (allApproved) {
        await db.execute(
          'UPDATE clearance_requests SET status = "completed", completed_at = NOW() WHERE id = ?',
          [request_id]
        );
      }
    }

    res.json({ 
      success: true, 
      message: `Office status updated to ${status}` 
    });

  } catch (error) {
    console.error("Update Node Error:", error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update status' 
    });
  }
};

// 3. Get Staff Clearance Progress
exports.getStaffClearanceProgress = async (req, res) => {
  const { user_id } = req.params;

  try {
    const query = `
      SELECT 
        r.id as request_id, 
        r.status as overall_status, 
        r.started_at,
        r.completed_at,
        n.*
      FROM clearance_requests r
      JOIN staff_clearance_nodes n ON r.id = n.request_id
      WHERE r.user_id = ? 
      ORDER BY r.started_at DESC LIMIT 1
    `;

    const [rows] = await db.execute(query, [user_id]);

    if (rows.length === 0) {
      return res.json({
        success: true,
        message: 'No active clearance request',
        node_details: {},
        progress: { total: STAFF_NODES.length, approved: 0, percentage: 0 }
      });
    }

    const data = rows[0];
    
    let approvedCount = 0;
    const details = {};

    STAFF_NODES.forEach(node => {
      details[node] = data[node] || 'pending';
      if (data[node] === 'approved') approvedCount++;
    });

    const percentage = Math.round((approvedCount / STAFF_NODES.length) * 100);
    const isCompleted = data.overall_status === 'completed';

    res.json({
      success: true,
      request_id: data.request_id,
      overall_status: data.overall_status,
      started_at: data.started_at,
      completed_at: data.completed_at,
      is_completed: isCompleted,
      progress: {
        total_nodes: STAFF_NODES.length,
        approved_nodes: approvedCount,
        percentage: percentage
      },
      node_details: details
    });

  } catch (error) {
    console.error("Get Progress Error:", error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch progress' 
    });
  }
};

// 4. Generate Final QR for Staff
exports.generateStaffFinalQR = async (req, res) => {
  const { request_id } = req.params;

  try {
    const [rows] = await db.execute(
      `SELECT ${STAFF_NODES.join(', ')} FROM staff_clearance_nodes WHERE request_id = ?`,
      [request_id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "Clearance request not found" 
      });
    }

    const node = rows[0];
    const allApproved = STAFF_NODES.every(nodeName => node[nodeName] === 'approved');

    if (!allApproved) {
      const approvedCount = STAFF_NODES.filter(nodeName => node[nodeName] === 'approved').length;
      return res.status(400).json({ 
        success: false, 
        message: "Clearance not complete yet", 
        pending: STAFF_NODES.length - approvedCount 
      });
    }

    // Get user info for QR payload
    const [userInfo] = await db.execute(
      'SELECT id, full_name, identifier_id FROM users WHERE id = (SELECT user_id FROM clearance_requests WHERE id = ?)',
      [request_id]
    );

    const qrPayload = {
      userId: userInfo[0].id,
      name: userInfo[0].full_name,
      timestamp: Date.now(),
      expiry: Date.now() + (48 * 3600 * 1000),
      type: 'staff'
    };

    // Simple encryption (same as mobile app)
    const jsonString = JSON.stringify(qrPayload);
    const encrypted = Buffer.from(jsonString).toString('base64');

    // Save QR code to database
    await db.execute(
      'UPDATE clearance_requests SET final_qr_code = ? WHERE id = ?',
      [encrypted, request_id]
    );

    res.json({
      success: true,
      qr_string: encrypted,
      message: "Staff clearance QR code generated successfully!"
    });

  } catch (error) {
    console.error("QR Generation Error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to generate QR code" 
    });
  }
};

// 5. Get Pending Staff Approvals (for Web Dashboard)
exports.getPendingStaffApprovals = async (req, res) => {
  const { node_name } = req.query;

  if (!node_name || !STAFF_NODES.includes(node_name)) {
    return res.status(400).json({ 
      success: false, 
      message: "Valid node name is required" 
    });
  }

  try {
    const query = `
      SELECT 
        cr.id as request_id,
        u.full_name,
        u.identifier_id as staff_id,
        u.department,
        cr.request_type,
        cr.started_at,
        sn.${node_name} as status
      FROM clearance_requests cr
      JOIN users u ON cr.user_id = u.id
      JOIN staff_clearance_nodes sn ON cr.id = sn.request_id
      WHERE sn.${node_name} = 'pending'
      AND u.role IN ('staff', 'department_head')
      ORDER BY cr.started_at ASC
    `;
    
    const [requests] = await db.execute(query);
    res.json({ 
      success: true, 
      data: requests,
      count: requests.length
    });
    
  } catch (error) {
    console.error("Get Pending Approvals Error:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// 6. Approve Node for Staff
exports.approveStaffNode = async (req, res) => {
  const { request_id, node_name, status, comments, staff_id } = req.body;

  if (!STAFF_NODES.includes(node_name)) {
    return res.status(400).json({ 
      success: false, 
      message: "Invalid node name" 
    });
  }

  try {
    const query = `
      UPDATE staff_clearance_nodes 
      SET ${node_name} = ?, 
          comments = ?, 
          approved_by = ?,
          last_updated = CURRENT_TIMESTAMP
      WHERE request_id = ?
    `;
    
    await db.execute(query, [status, comments || null, staff_id || null, request_id]);

    // Check if all nodes are approved
    const [allNodes] = await db.execute(
      `SELECT ${STAFF_NODES.join(', ')} FROM staff_clearance_nodes WHERE request_id = ?`,
      [request_id]
    );

    if (allNodes.length > 0) {
      const allApproved = STAFF_NODES.every(node => allNodes[0][node] === 'approved');
      
      if (allApproved) {
        await db.execute(
          'UPDATE clearance_requests SET status = "completed", completed_at = NOW() WHERE id = ?',
          [request_id]
        );
      }
    }

    res.json({ 
      success: true, 
      message: `Node ${node_name} updated to ${status}` 
    });
    
  } catch (error) {
    console.error("Approve Node Error:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// 7. Get Staff Clearance Summary (for Admin)
exports.getStaffClearanceSummary = async (req, res) => {
  try {
    // Get all staff clearance requests
    const [requests] = await db.execute(`
      SELECT 
        cr.id,
        u.full_name,
        u.identifier_id,
        u.department,
        cr.request_type,
        cr.status,
        cr.started_at,
        cr.completed_at
      FROM clearance_requests cr
      JOIN users u ON cr.user_id = u.id
      WHERE u.role IN ('staff', 'department_head')
      ORDER BY cr.started_at DESC
    `);

    // Get statistics
    const [stats] = await db.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
      FROM clearance_requests cr
      JOIN users u ON cr.user_id = u.id
      WHERE u.role IN ('staff', 'department_head')
    `);

    res.json({
      success: true,
      data: requests,
      stats: stats[0],
      total_nodes: STAFF_NODES.length
    });
    
  } catch (error) {
    console.error("Get Staff Summary Error:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Export the nodes list for use in routes
exports.STAFF_NODES = STAFF_NODES;