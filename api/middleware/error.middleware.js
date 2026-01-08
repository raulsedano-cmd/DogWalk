export const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);

    // Prisma errors
    if (err.code === 'P2002') {
        return res.status(400).json({
            error: 'A record with this value already exists'
        });
    }

    if (err.code === 'P2025') {
        return res.status(404).json({
            error: 'Record not found'
        });
    }

    // Validation errors
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            error: err.message
        });
    }

    // Default error
    console.error('SERVER ERROR:', err.stack || err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error',
        debug: process.env.NODE_ENV === 'development' || !process.env.VERCEL ? err : undefined,
        details: err.stack ? 'Check server logs' : undefined
    });
};
