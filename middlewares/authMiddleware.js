export function isAuthenticated(req, res, next) {
    if (req.session.user) {
        return next();
    }
    res.status(401).json({ message: '❌ Unauthorized! Please log in.' });
}

export function isAdmin(req, res, next) {
    if (!req.session.user) {
        return res.status(401).json({ message: '❌ Unauthorized! Please log in.' });
    }
    if (req.session.user.role !== 'admin') {
        return res.status(403).json({ message: '❌ Access denied! Admins only.' });
    }
    next();
}

const authMiddleware = (req, res, next) => {
    // Middleware logic
    next();
};

export default authMiddleware;

app.get('/', (req, res) => {
    res.json({ message: 'Welcome to the API!' });
});

app.use('/api', userRoutes);
app.use('/api/admin', adminRoutes);

app.use((req, res) => {
    res.status(404).json({ message: '❌ Page not found' });
});