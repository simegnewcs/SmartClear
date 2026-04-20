const db = require('../config/db');
const jwt = require('jsonwebtoken');

/**
 * @desc    ተጠቃሚዎችን በ Email (Web) ወይም በ ID (Mobile) ሎጊን ማድረግ
 * @route   POST /api/v1/auth/login
 */
exports.login = async (req, res) => {
    // React `{email}` ቢልክም ወይም Mobile `{identifier_id}` ቢልክም ይቀበላል
    const { email, identifier_id, password } = req.body;
    
    // የትኛው ዳታ እንደመጣ መለየት (Smart Identifier)
    const loginCredential = email || identifier_id;

    if (!loginCredential || !password) {
        return res.status(400).json({
            success: false,
            message: 'እባክዎ መረጃዎን በትክክል ያስገቡ'
        });
    }

    try {
        // 1. ተጠቃሚውን በ Email ወይም በ Identifier_ID መፈለግ (OR Logic)
        // ይህ ለአድሚን በኢሜይል፣ ለተማሪ በ ID እንዲሰሩ ያደርጋቸዋል
        const query = 'SELECT * FROM users WHERE email = ? OR identifier_id = ?';
        const [users] = await db.execute(query, [loginCredential, loginCredential]);

        if (users.length === 0) {
            return res.status(401).json({ 
                success: false,
                message: 'ተጠቃሚው አልተገኘም (ኢሜይል ወይም መለያ ቁጥሩን ያረጋግጡ)' 
            });
        }

        const user = users[0];

        // 2. ፓስወርድ ማረጋገጥ 
        if (password !== user.password) {
            return res.status(401).json({ 
                success: false,
                message: 'የተሳሳተ የይለፍ ቃል ተጠቅመዋል' 
            });
        }

        // 3. JWT Token መፍጠር
        const token = jwt.sign(
            { 
                id: user.id, 
                role: user.role, 
                name: user.full_name,
                identifier_id: user.identifier_id,
                assigned_node: user.assigned_node // ለ Staff Approvals አስፈላጊ ነው
            },
            process.env.JWT_SECRET || 'DEVVOLTZ_SECRET_KEY_2026',
            { expiresIn: '24h' }
        );

        // 4. ምላሽ መላክ (Response)
        res.status(200).json({
            success: true,
            message: 'በተሳካ ሁኔታ ገብተዋል',
            token: token,
            user: {
                id: user.id,
                full_name: user.full_name,
                role: user.role,
                identifier_id: user.identifier_id,
                email: user.email,
                assigned_node: user.assigned_node // ዌብ ዳሽቦርዱ የትኛውን ገጽ ማሳየት እንዳለበት እንዲያውቅ
            }
        });

    } catch (error) {
        // 500 Error እዚህ ጋር ነው የሚመከረው - Console ላይ ስህተቱን ያሳየናል
        console.error("CRITICAL AUTH ERROR:", error);
        res.status(500).json({ 
            success: false, 
            message: 'የሰርቨር ስህተት አጋጥሟል (Database Connection Check ያድርጉ)' 
        });
    }
};

/**
 * @desc    የተጠቃሚውን መረጃ በ Token ማረጋገጥ
 */
exports.getMe = async (req, res) => {
    try {
        const userId = req.user.id; 
        const [users] = await db.execute(
            'SELECT id, full_name, role, identifier_id, email, assigned_node FROM users WHERE id = ?', 
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: 'ተጠቃሚው አልተገኘም' });
        }

        res.json({ success: true, user: users[0] });
    } catch (error) {
        console.error("GET ME ERROR:", error);
        res.status(500).json({ message: 'ስህተት አጋጥሟል' });
    }
};