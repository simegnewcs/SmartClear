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

// Get list of approving officers (users who can approve)
exports.getApprovingOfficers = async (req, res) => {
  try {
    const [officers] = await db.execute(`
      SELECT id, full_name, identifier_id, department 
      FROM users 
      WHERE role IN ('admin', 'department_head', 'supervisor', 'hr')
      ORDER BY full_name ASC
    `);
    
    res.json({
      success: true,
      data: officers
    });
  } catch (error) {
    console.error("Get Officers Error:", error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch approving officers' 
    });
  }
};

// 1. Initiate Staff Clearance with Approving Officer
exports.initiateStaffClearance = async (req, res) => {
  const { user_id, request_type, approving_officer_id } = req.body;

  if (!approving_officer_id) {
    return res.status(400).json({ 
      success: false, 
      message: 'Please select an approving officer' 
    });
  }

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

    // Get approving officer details
    const [officer] = await connection.execute(
      'SELECT full_name FROM users WHERE id = ?',
      [approving_officer_id]
    );

    // Create new clearance request with initial approval pending
    const [requestResult] = await connection.execute(
      `INSERT INTO clearance_requests 
        (user_id, request_type, status, approving_officer_id, approving_officer_name, initial_approval_status) 
       VALUES (?, ?, 'pending', ?, ?, 'pending')`,
      [user_id, request_type, approving_officer_id, officer[0]?.full_name]
    );

    const requestId = requestResult.insertId;

    // Insert all 21 nodes as PENDING (locked) until initial approval
    // Using 'pending' instead of 'inactive' to match ENUM constraints
    const nodeColumns = STAFF_NODES.join(', ');
    const nodePlaceholders = STAFF_NODES.map(() => "'pending'").join(', ');
    
    await connection.execute(
      `INSERT INTO staff_clearance_nodes (request_id, ${nodeColumns}) VALUES (?, ${nodePlaceholders})`,
      [requestId]
    );

    await connection.commit();
    
    res.status(201).json({
      success: true,
      message: 'Staff clearance request submitted. Awaiting approving officer approval.',
      requestId: requestId,
      initial_approval_pending: true
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

// 2. Approving Officer Approves/Rejects Initial Request
exports.processInitialApproval = async (req, res) => {
  const { request_id, action, comments, officer_id } = req.body;

  if (!['approved', 'rejected'].includes(action)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Invalid action. Must be approved or rejected' 
    });
  }

  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    // Get request details
    const [request] = await connection.execute(
      'SELECT * FROM clearance_requests WHERE id = ?',
      [request_id]
    );

    if (request.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Clearance request not found' 
      });
    }

    if (request[0].initial_approval_status !== 'pending') {
      return res.status(400).json({ 
        success: false, 
        message: 'This request has already been processed' 
      });
    }

    if (action === 'approved') {
      // Update request status
      await connection.execute(
        `UPDATE clearance_requests 
         SET initial_approval_status = 'approved', 
             initial_approval_at = NOW(),
             initial_approval_comments = ?,
             status = 'in_progress'
         WHERE id = ?`,
        [comments || null, request_id]
      );

      // Activate all 21 nodes (change from 'inactive' to 'pending')
      const updateQueries = STAFF_NODES.map(node => 
        `${node} = 'pending'`
      ).join(', ');
      
      await connection.execute(
        `UPDATE staff_clearance_nodes SET ${updateQueries} WHERE request_id = ?`,
        [request_id]
      );

      res.json({
        success: true,
        message: 'Clearance request approved. All 21 offices are now active for approval.',
        status: 'approved'
      });
      
    } else {
      // Rejected
      await connection.execute(
        `UPDATE clearance_requests 
         SET initial_approval_status = 'rejected', 
             initial_approval_at = NOW(),
             initial_approval_comments = ?,
             status = 'rejected'
         WHERE id = ?`,
        [comments || null, request_id]
      );

      res.json({
        success: true,
        message: 'Clearance request rejected. Staff member has been notified.',
        status: 'rejected'
      });
    }

    await connection.commit();

  } catch (error) {
    await connection.rollback();
    console.error("Initial Approval Error:", error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to process approval' 
    });
  } finally {
    connection.release();
  }
};

// 3. Update Node Status (only allowed after initial approval)
exports.updateStaffNodeStatus = async (req, res) => {
  const { request_id, column_name, status, comments, approved_by } = req.body;

  if (!STAFF_NODES.includes(column_name)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Invalid office name' 
    });
  }

  try {
    // Check if initial approval has been granted
    const [request] = await db.execute(
      'SELECT initial_approval_status, status FROM clearance_requests WHERE id = ?',
      [request_id]
    );

    if (request.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Clearance request not found' 
      });
    }

    if (request[0].initial_approval_status !== 'approved') {
      return res.status(403).json({ 
        success: false, 
        message: 'Cannot update nodes: Awaiting initial approval from approving officer',
        status: 'waiting_for_approval'
      });
    }

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

// 4. Get Staff Clearance Progress (with initial approval status)
exports.getStaffClearanceProgress = async (req, res) => {
  const { user_id } = req.params;

  try {
    const query = `
      SELECT 
        r.id as request_id, 
        r.status as overall_status, 
        r.started_at,
        r.completed_at,
        r.approving_officer_id,
        r.approving_officer_name,
        r.initial_approval_status,
        r.initial_approval_at,
        r.initial_approval_comments,
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
        progress: { total: STAFF_NODES.length, approved: 0, percentage: 0 },
        initial_approval: { status: 'none', pending: false }
      });
    }

    const data = rows[0];
    
    let approvedCount = 0;
    let activeCount = 0;
    const details = {};

    STAFF_NODES.forEach(node => {
      const nodeStatus = data[node] || 'pending';
      details[node] = nodeStatus;
      if (nodeStatus === 'approved') approvedCount++;
      if (nodeStatus !== 'inactive') activeCount++;
    });

    const percentage = data.initial_approval_status === 'approved' 
      ? Math.round((approvedCount / STAFF_NODES.length) * 100)
      : 0;
    
    const isCompleted = data.overall_status === 'completed';
    const isWaitingForApproval = data.initial_approval_status === 'pending';
    const isInitialApproved = data.initial_approval_status === 'approved';
    const isRejected = data.initial_approval_status === 'rejected';

    res.json({
      success: true,
      request_id: data.request_id,
      overall_status: data.overall_status,
      started_at: data.started_at,
      completed_at: data.completed_at,
      is_completed: isCompleted,
      initial_approval: {
        status: data.initial_approval_status,
        officer_name: data.approving_officer_name,
        approved_at: data.initial_approval_at,
        comments: data.initial_approval_comments,
        is_pending: isWaitingForApproval,
        is_approved: isInitialApproved,
        is_rejected: isRejected
      },
      progress: {
        total_nodes: STAFF_NODES.length,
        approved_nodes: approvedCount,
        active_nodes: activeCount,
        percentage: percentage,
        is_locked: isWaitingForApproval
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

// 5. Get Pending Initial Approvals (for Approving Officers - STAFF ONLY)
exports.getPendingInitialApprovals = async (req, res) => {
  const { officer_id } = req.query;

  try {
    // Only fetch STAFF clearance requests (not student requests)
    const query = `
      SELECT 
        cr.id as request_id,
        u.full_name as staff_name,
        u.identifier_id as staff_id,
        u.department,
        cr.request_type,
        cr.started_at,
        cr.approving_officer_name
      FROM clearance_requests cr
      JOIN users u ON cr.user_id = u.id
      WHERE cr.initial_approval_status = 'pending'
      AND cr.approving_officer_id = ?
      AND u.role IN ('staff', 'department_head', 'supervisor')
      ORDER BY cr.started_at ASC
    `;
    
    const [requests] = await db.execute(query, [officer_id || 0]);
    
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

// 6. Get Pending Staff Approvals (for Node Approvers - after initial approval)
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
        cr.initial_approval_status,
        sn.${node_name} as status
      FROM clearance_requests cr
      JOIN users u ON cr.user_id = u.id
      JOIN staff_clearance_nodes sn ON cr.id = sn.request_id
      WHERE sn.${node_name} = 'pending'
      AND cr.initial_approval_status = 'approved'
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

// 7. Generate Final QR for Staff (only after all nodes approved)
exports.generateStaffFinalQR = async (req, res) => {
  const { request_id } = req.params;

  try {
    // Check initial approval status
    const [request] = await db.execute(
      'SELECT initial_approval_status FROM clearance_requests WHERE id = ?',
      [request_id]
    );

    if (request.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "Clearance request not found" 
      });
    }

    if (request[0].initial_approval_status !== 'approved') {
      return res.status(403).json({ 
        success: false, 
        message: "Cannot generate QR: Awaiting initial approval" 
      });
    }

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

    const jsonString = JSON.stringify(qrPayload);
    const encrypted = Buffer.from(jsonString).toString('base64');

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

// ============================================================
// ROLE-BASED APPROVAL DASHBOARD METHODS
// For Student Approval Team (8 staff) and Additional Team (21 staff)
// ============================================================

/**
 * @desc    Get pending approvals for the logged-in staff member
 * Staff only sees requests assigned to their node
 * @route   GET /api/v1/staff/my-pending-approvals
 */
exports.getMyPendingApprovals = async (req, res) => {
  try {
    const staffId = req.user.id;
    const assignedNode = req.user.assigned_node;

    // Check if staff has a node assignment
    if (!assignedNode) {
      return res.status(400).json({
        success: false,
        message: 'You are not assigned to any approval node. Contact admin.'
      });
    }

    // Get requests for this staff's assigned node
    // Show both 'pending' (ready to approve) and 'locked' (waiting in workflow)
    const query = `
      SELECT 
        cr.id as request_id,
        cr.request_type,
        cr.started_at,
        cr.initial_approval_status,
        cr.initial_approval_at,
        u.id as applicant_id,
        u.full_name as applicant_name,
        u.identifier_id as applicant_id_number,
        u.department_name as applicant_department,
        u.role as applicant_role,
        sn.${assignedNode} as node_status,
        sn.comments as node_comments
      FROM clearance_requests cr
      JOIN users u ON cr.user_id = u.id
      JOIN staff_clearance_nodes sn ON cr.id = sn.request_id
      WHERE sn.${assignedNode} IN ('pending', 'locked')
      AND cr.status IN ('pending', 'in_progress')
      AND (
        -- Students don't need initial approval
        u.role = 'student' 
        -- Staff need initial approval first
        OR (u.role IN ('staff', 'department_head') AND cr.initial_approval_status = 'approved')
      )
      ORDER BY 
        CASE sn.${assignedNode}
          WHEN 'pending' THEN 1
          WHEN 'locked' THEN 2
        END,
        cr.started_at ASC
    `;

    const [requests] = await db.execute(query);

    // Get summary stats - count pending (actionable) and locked (waiting)
    const [stats] = await db.execute(`
      SELECT 
        COUNT(*) as total_requests,
        SUM(CASE WHEN sn.${assignedNode} = 'pending' THEN 1 ELSE 0 END) as pending_now,
        SUM(CASE WHEN sn.${assignedNode} = 'locked' THEN 1 ELSE 0 END) as locked_waiting,
        SUM(CASE WHEN u.role = 'student' THEN 1 ELSE 0 END) as student_requests,
        SUM(CASE WHEN u.role IN ('staff', 'department_head') THEN 1 ELSE 0 END) as staff_requests
      FROM clearance_requests cr
      JOIN users u ON cr.user_id = u.id
      JOIN staff_clearance_nodes sn ON cr.id = sn.request_id
      WHERE sn.${assignedNode} IN ('pending', 'locked')
      AND cr.status IN ('pending', 'in_progress')
      AND (
        u.role = 'student' 
        OR (u.role IN ('staff', 'department_head') AND cr.initial_approval_status = 'approved')
      )
    `);

    // Get workflow info for student requests (show locked nodes status)
    let workflowInfo = null;
    if (requests.length > 0 && requests[0].applicant_role === 'student') {
      const [workflow] = await db.execute(`
        SELECT 
          batch_advisor_status,
          chair_holder_status,
          library_status,
          sports_status,
          book_store_status,
          housing_status,
          regular_budget_status,
          registrar_status
        FROM staff_clearance_nodes
        WHERE request_id = ?
      `, [requests[0].request_id]);
      
      if (workflow.length > 0) {
        workflowInfo = {
          step1_batch_advisor: workflow[0].batch_advisor_status,
          step2_chair_holder: workflow[0].chair_holder_status,
          step3_others: {
            library: workflow[0].library_status,
            sports: workflow[0].sports_status,
            book_store: workflow[0].book_store_status,
            housing: workflow[0].housing_status,
            cafeteria: workflow[0].regular_budget_status,
            registrar: workflow[0].registrar_status
          }
        };
      }
    }

    res.json({
      success: true,
      staff_info: {
        id: staffId,
        assigned_node: assignedNode,
        node_display_name: assignedNode.replace(/_/g, ' ').replace(/status/g, '').trim()
      },
      stats: {
        total: stats[0].total_requests,
        pending_now: stats[0].pending_now,
        locked_waiting: stats[0].locked_waiting,
        student_requests: stats[0].student_requests,
        staff_requests: stats[0].staff_requests
      },
      workflow: workflowInfo,
      data: requests,
      count: requests.length,
      note: 'Sequential workflow: Batch Advisor → Chair Holder → Others (Parallel)',
      help: 'Requests marked as LOCKED are waiting for previous approvals in the workflow'
    });

  } catch (error) {
    console.error("Get My Pending Approvals Error:", error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending approvals'
    });
  }
};

/**
 * @desc    Approve or reject a clearance request at the staff's assigned node
 * @route   POST /api/v1/staff/approve-request
 */
exports.approveRequest = async (req, res) => {
  const { request_id, action, remarks } = req.body;
  const staffId = req.user.id;
  const assignedNode = req.user.assigned_node;

  // Validate action
  if (!['approved', 'rejected', 'correction_needed'].includes(action)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid action. Must be approved, rejected, or correction_needed'
    });
  }

  if (!assignedNode) {
    return res.status(403).json({
      success: false,
      message: 'You are not assigned to any approval node'
    });
  }

  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    // Verify the request exists and is pending at this node
    // Students: no initial approval needed
    // Staff: require initial_approval_status = 'approved'
    const [requestCheck] = await connection.execute(
      `SELECT cr.*, sn.${assignedNode} as node_status, u.full_name as applicant_name, u.role as applicant_role
       FROM clearance_requests cr
       JOIN staff_clearance_nodes sn ON cr.id = sn.request_id
       JOIN users u ON cr.user_id = u.id
       WHERE cr.id = ? 
       AND (
         u.role = 'student'  -- Students don't need initial approval
         OR (u.role IN ('staff', 'department_head') AND cr.initial_approval_status = 'approved')
       )`,
      [request_id]
    );

    if (requestCheck.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({
        success: false,
        message: 'Request not found or not yet approved by supervisor'
      });
    }

    if (requestCheck[0].node_status !== 'pending') {
      await connection.rollback();
      connection.release();
      return res.status(400).json({
        success: false,
        message: `This request has already been ${requestCheck[0].node_status}`
      });
    }

    // Get staff name for audit
    const [staffInfo] = await connection.execute(
      'SELECT full_name FROM users WHERE id = ?',
      [staffId]
    );
    const staffName = staffInfo[0]?.full_name || 'Unknown';

    // Update the node status
    await connection.execute(
      `UPDATE staff_clearance_nodes 
       SET ${assignedNode} = ?, 
           comments = CONCAT(IFNULL(comments, ''), '\n[${staffName}]: ', ?),
           last_updated = CURRENT_TIMESTAMP
       WHERE request_id = ?`,
      [action === 'correction_needed' ? 'rejected' : action, remarks || 'No remarks', request_id]
    );

    // If rejected, update overall request status
    if (action === 'rejected' || action === 'correction_needed') {
      await connection.execute(
        `UPDATE clearance_requests 
         SET status = 'rejected', 
             completed_at = NOW()
         WHERE id = ?`,
        [request_id]
      );
    }

    // Log the approval action
    await connection.execute(
      `INSERT INTO approval_logs 
       (request_id, node_name, approver_id, approver_name, action, remarks, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [request_id, assignedNode, staffId, staffName, action, remarks || null]
    );

    await connection.commit();
    connection.release();

    res.json({
      success: true,
      message: `Request ${action === 'correction_needed' ? 'marked for correction' : action} successfully`,
      data: {
        request_id,
        node: assignedNode,
        action,
        processed_by: staffName,
        processed_at: new Date().toISOString()
      }
    });

  } catch (error) {
    await connection.rollback();
    connection.release();
    console.error("Approve Request Error:", error);
    res.status(500).json({
      success: false,
      message: 'Failed to process approval'
    });
  }
};

/**
 * @desc    Get staff dashboard data - summary of their approval activities
 * @route   GET /api/v1/staff/dashboard
 */
exports.getStaffDashboard = async (req, res) => {
  try {
    const staffId = req.user.id;
    const assignedNode = req.user.assigned_node;

    if (!assignedNode) {
      return res.json({
        success: true,
        staff_info: {
          id: staffId,
          assigned_node: null,
          message: 'No node assignment'
        },
        stats: {
          pending: 0,
          approved_today: 0,
          total_approved: 0,
          total_rejected: 0
        }
      });
    }

    // Pending approvals at this node
    const [pending] = await db.execute(`
      SELECT COUNT(*) as count 
      FROM clearance_requests cr
      JOIN staff_clearance_nodes sn ON cr.id = sn.request_id
      WHERE sn.${assignedNode} = 'pending'
      AND cr.initial_approval_status = 'approved'
      AND cr.status IN ('pending', 'in_progress')
    `);

    // Approved today by this staff
    const [approvedToday] = await db.execute(`
      SELECT COUNT(*) as count 
      FROM approval_logs
      WHERE approver_id = ? 
      AND action = 'approved'
      AND DATE(created_at) = CURDATE()
    `, [staffId]);

    // Total approved by this staff
    const [totalApproved] = await db.execute(`
      SELECT COUNT(*) as count 
      FROM approval_logs
      WHERE approver_id = ? AND action = 'approved'
    `, [staffId]);

    // Total rejected by this staff
    const [totalRejected] = await db.execute(`
      SELECT COUNT(*) as count 
      FROM approval_logs
      WHERE approver_id = ? AND action IN ('rejected', 'correction_needed')
    `, [staffId]);

    // Recent activity
    const [recentActivity] = await db.execute(`
      SELECT 
        al.*,
        u.full_name as applicant_name,
        cr.request_type
      FROM approval_logs al
      JOIN clearance_requests cr ON al.request_id = cr.id
      JOIN users u ON cr.user_id = u.id
      WHERE al.approver_id = ?
      ORDER BY al.created_at DESC
      LIMIT 10
    `, [staffId]);

    res.json({
      success: true,
      staff_info: {
        id: staffId,
        assigned_node: assignedNode,
        node_display_name: assignedNode.replace(/_/g, ' ').replace(/status/g, '').trim()
      },
      stats: {
        pending: pending[0].count,
        approved_today: approvedToday[0].count,
        total_approved: totalApproved[0].count,
        total_rejected: totalRejected[0].count
      },
      recent_activity: recentActivity
    });

  } catch (error) {
    console.error("Staff Dashboard Error:", error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data'
    });
  }
};

/**
 * @desc    Get approval history for a specific request
 * @route   GET /api/v1/staff/approval-history/:request_id
 */
exports.getApprovalHistory = async (req, res) => {
  const { request_id } = req.params;

  try {
    // Check if user can access this request
    const [requestCheck] = await db.execute(
      'SELECT user_id FROM clearance_requests WHERE id = ?',
      [request_id]
    );

    if (requestCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    // Staff can only see if their node is involved, admin can see all, owner can see all
    const canAccess = req.user.role === 'admin' || 
                      requestCheck[0].user_id === req.user.id ||
                      req.user.role === 'staff';

    if (!canAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const [history] = await db.execute(`
      SELECT 
        al.*,
        u.full_name as approver_name
      FROM approval_logs al
      JOIN users u ON al.approver_id = u.id
      WHERE al.request_id = ?
      ORDER BY al.created_at DESC
    `, [request_id]);

    res.json({
      success: true,
      data: history,
      count: history.length
    });

  } catch (error) {
    console.error("Approval History Error:", error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch approval history'
    });
  }
};

// Export the nodes list
exports.STAFF_NODES = STAFF_NODES;