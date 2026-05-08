const jwt = require('jsonwebtoken');
const db = require('../config/db');

/**
 * @desc    Verify JWT Token and attach user to request
 */
const authenticate = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.'
            });
        }

        const token = authHeader.split(' ')[1];

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'DEVVOLTZ_SECRET_KEY_2026');
        
        // Attach user info to request
        req.user = {
            id: decoded.id,
            role: decoded.role,
            name: decoded.name,
            identifier_id: decoded.identifier_id,
            assigned_node: decoded.assigned_node
        };

        // Verify user still exists in database
        const [users] = await db.execute(
            'SELECT id, role, assigned_node, full_name FROM users WHERE id = ?',
            [decoded.id]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'User no longer exists.'
            });
        }

        // Update req.user with latest data from DB
        req.user = {
            ...req.user,
            ...users[0]
        };

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token.'
            });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired. Please login again.'
            });
        }
        
        console.error('Authentication Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Authentication failed.'
        });
    }
};

/**
 * @desc    Authorize specific roles
 * @param   {...string} roles - Allowed roles
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required.'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Required role: ${roles.join(' or ')}. Your role: ${req.user.role}`
            });
        }

        next();
    };
};

/**
 * @desc    Check if staff member can access specific node
 * Used for the 21 staff members - ensures they can only see their assigned node
 */
const restrictToNode = (requiredNode) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required.'
            });
        }

        // Super Admin can access all nodes
        if (req.user.role === 'admin') {
            return next();
        }

        // Department head can access their department related nodes
        if (req.user.role === 'department_head') {
            return next();
        }

        // Staff must have matching assigned_node
        if (req.user.role === 'staff') {
            if (req.user.assigned_node === requiredNode) {
                return next();
            }
            
            // Staff can also access if they're checking their own assigned node
            if (!requiredNode || req.user.assigned_node === requiredNode) {
                return next();
            }

            return res.status(403).json({
                success: false,
                message: `Access denied. You are assigned to: ${req.user.assigned_node}. Cannot access: ${requiredNode}`
            });
        }

        return res.status(403).json({
            success: false,
            message: 'Access denied. Insufficient permissions.'
        });
    };
};

/**
 * @desc    Check if user can access specific clearance request
 * Super Admin: All requests
 * Staff: Only requests where their node is pending
 * Students: Only their own requests
 */
const canAccessRequest = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required.'
            });
        }

        const requestId = req.params.request_id || req.params.id;
        
        if (!requestId) {
            return next(); // No request ID to check
        }

        // Super Admin can access all
        if (req.user.role === 'admin') {
            return next();
        }

        // Get the clearance request
        const [requests] = await db.execute(
            'SELECT * FROM clearance_requests WHERE id = ?',
            [requestId]
        );

        if (requests.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Clearance request not found.'
            });
        }

        const request = requests[0];

        // Students can only access their own requests
        if (req.user.role === 'student') {
            if (request.user_id !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. You can only view your own requests.'
                });
            }
            return next();
        }

        // Staff can access if their assigned node is involved
        if (req.user.role === 'staff' && req.user.assigned_node) {
            // Get the node status
            const [nodes] = await db.execute(
                `SELECT ${req.user.assigned_node} as node_status FROM staff_clearance_nodes WHERE request_id = ?`,
                [requestId]
            );

            if (nodes.length > 0) {
                // Staff can access requests where their node is involved
                return next();
            }
        }

        // Guard can access for QR verification
        if (req.user.role === 'guard') {
            return next();
        }

        return res.status(403).json({
            success: false,
            message: 'Access denied. You do not have permission to view this request.'
        });

    } catch (error) {
        console.error('Can Access Request Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Authorization check failed.'
        });
    }
};

/**
 * @desc    Role hierarchy check
 * Returns numeric level for role comparison
 */
const getRoleLevel = (role) => {
    const hierarchy = {
        'admin': 5,
        'department_head': 4,
        'staff': 3,
        'guard': 2,
        'student': 1
    };
    return hierarchy[role] || 0;
};

/**
 * @desc    Check if user has minimum role level
 */
const requireMinLevel = (minLevel) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required.'
            });
        }

        const userLevel = getRoleLevel(req.user.role);
        
        if (userLevel < minLevel) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Required level: ${minLevel}. Your level: ${userLevel}`
            });
        }

        next();
    };
};

module.exports = {
    authenticate,
    authorize,
    restrictToNode,
    canAccessRequest,
    getRoleLevel,
    requireMinLevel
};
