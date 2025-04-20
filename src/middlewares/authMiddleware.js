// middlewares/authMiddleware.js

export function isAuthenticated(req, res, next) {
    if (req.session && req.session.user) {
        return next();
    }
    res.status(401).json({ message: '❌ Unauthorized! Please log in.' });
}

// Check if user is admin
export const isAdmin = (req, res, next) => {
    // تفاصيل أكثر في الـ logging
    console.log('👤 Session details:', {
        isAuthenticated: !!req.session,
        hasUser: !!req.session?.user,
        userDetails: {
            id: req.session?.user?.id,
            email: req.session?.user?.email,
            role: req.session?.user?.role
        }
    });

    if (req.session.user && req.session.user.role === 'admin') {
        console.log('✅ Admin access granted for:', req.session.user.email);
        next();
    } else {
        console.log('❌ Admin access denied:', {
            email: req.session?.user?.email,
            currentRole: req.session?.user?.role
        });
        res.status(403).json({
            success: false,
            message: '❌ Access denied! Admins only.'
        });
    }
};
