const db = require('../config/db');

exports.getUserNotifications = async (req, res) => {
  const { userId } = req.params;
  
  try {
    // Simple query to get clearance status updates
    const [clearanceRequests] = await db.execute(`
      SELECT 
        cr.id,
        cr.status,
        cr.started_at,
        cr.completed_at,
        u.full_name
      FROM clearance_requests cr
      JOIN users u ON cr.user_id = u.id
      WHERE cr.user_id = ?
      ORDER BY cr.started_at DESC
      LIMIT 10
    `, [userId]);
    
    // Format as notifications
    const notifications = clearanceRequests.map(req => ({
      id: req.id,
      type: req.status === 'completed' ? 'approved' : 'pending',
      title: req.status === 'completed' ? 'Clearance Complete' : 'Clearance in Progress',
      message: req.status === 'completed' 
        ? `Your clearance has been completed on ${new Date(req.completed_at).toLocaleDateString()}`
        : `Your clearance request was submitted on ${new Date(req.started_at).toLocaleDateString()}`,
      created_at: req.started_at,
    }));
    
    // If no clearance requests, return welcome notification
    if (notifications.length === 0) {
      return res.json([{
        id: 0,
        type: 'info',
        title: 'Welcome to SmartClear',
        message: 'Start your clearance application from the home screen',
        created_at: new Date().toISOString(),
      }]);
    }
    
    res.json(notifications);
  } catch (error) {
    console.error('Notifications error:', error);
    // Return empty array instead of 500
    res.status(200).json([]);
  }
};

// backend/src/controllers/notificationController.js (add this function)
exports.notifyClearanceExpired = async (req, res) => {
  const { user_id, student_name, student_identifier, expiry_time, clearance_type } = req.body;
  
  try {
    // Log the expiry event
    await db.execute(`
      INSERT INTO clearance_expiry_logs (user_id, student_name, student_identifier, expiry_time, clearance_type, notified_at)
      VALUES (?, ?, ?, ?, ?, NOW())
    `, [user_id, student_name, student_identifier, expiry_time, clearance_type]);
    
    // You can also:
    // 1. Send email to registrar
    // 2. Create a notification in the admin dashboard
    // 3. Send SMS alert
    
    res.json({ success: true, message: 'Registrar notified' });
  } catch (error) {
    console.error('Expiry notification error:', error);
    res.status(500).json({ success: false, message: 'Failed to send notification' });
  }
};

