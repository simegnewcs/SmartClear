const db = require('../config/db');

exports.verifyExitQR = async (req, res) => {
    const { qr_token } = req.body; // ከ QR ኮዱ የሚነበብ መታወቂያ

    try {
        // 1. የክሊራንስ ጥያቄውን መፈለግ
        // QR ኮዱ ከ requestId ጋር የተያያዘ መሆን አለበት
        const query = `
            SELECT r.id, r.status, u.full_name, u.role, u.identifier_id, u.profile_pic
            FROM clearance_requests r
            JOIN users u ON r.user_id = u.id
            WHERE r.id = ?
        `;

        const [rows] = await db.execute(query, [qr_token]);

        if (rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: '❌ ልክ ያልሆነ QR ኮድ! (Invalid QR)' 
            });
        }

        const request = rows[0];

        // 2. ሂደቱ መጠናቀቁን ማረጋገጥ
        if (request.status !== 'completed') {
            return res.status(403).json({ 
                success: false, 
                message: `⚠️ ክሊራንሱ ገና አልተጠናቀቀም። ሁኔታ፡ ${request.status}`,
                user: request.full_name
            });
        }

        // 3. መውጫውን መመዝገብ (Exit Log)
        // እዚህ ጋር ለወደፊት exit_logs የሚል ሰንጠረዥ ማከል እንችላለን
        await db.execute(
            'UPDATE clearance_requests SET completed_at = NOW() WHERE id = ?',
            [request.id]
        );

        res.json({
            success: true,
            message: '✅ ፍቃድ ተሰጥቷል። መውጣት ይችላሉ።',
            user_info: {
                name: request.full_name,
                id: request.identifier_id,
                role: request.role,
                photo: request.profile_pic
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'የሰርቨር ስህተት አጋጥሟል' });
    }
};
// backend/src/controllers/guardController.js (add this function)
exports.verifyStudentById = async (req, res) => {
  const { userId } = req.params;
  
  try {
    // Get user details
    const [users] = await db.execute(
      'SELECT id, full_name, identifier_id, department, email, phone FROM users WHERE id = ?',
      [userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    
    // Get clearance status
    const [clearance] = await db.execute(`
      SELECT cr.status, cr.completed_at, 
             (SELECT COUNT(*) FROM staff_clearance_nodes WHERE request_id = cr.id AND 
              (batch_advisor_status = 'approved' AND chair_holder_status = 'approved' AND
               library_status = 'approved' AND sports_status = 'approved' AND
               book_store_status = 'approved' AND housing_status = 'approved' AND
               regular_budget_status = 'approved' AND registrar_status = 'approved')) as approved_count
      FROM clearance_requests cr
      WHERE cr.user_id = ? AND cr.status = 'completed'
      ORDER BY cr.started_at DESC LIMIT 1
    `, [userId]);
    
    res.json({
      success: true,
      user: users[0],
      clearance_status: clearance[0] || { status: 'pending' }
    });
  } catch (error) {
    console.error('Guard verification error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

