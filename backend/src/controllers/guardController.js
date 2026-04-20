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