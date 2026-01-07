const express = require('express');
const cors = require('cors');
const { prisma } = require('./src/utils/helpers');
const logger = require('./src/utils/logger');
const challengesRouter = require('./src/routes/challenges');
const usersRouter = require('./src/routes/users');
const checksRouter = require('./src/routes/checks');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Request logging middleware
app.use((req, res, next) => {
    const start = Date.now();
    const requestId = Math.random().toString(36).substring(7);

    req.log = logger.child({ requestId });

    res.on('finish', () => {
        const duration = Date.now() - start;
        req.log.info({
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            duration
        }, 'Request completed');
    });

    next();
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', time: Date.now() });
});

// Mount route modules
app.use('/challenges', challengesRouter);
app.use('/users', usersRouter);
app.use('/checks', checksRouter);

// Global error handler
app.use((err, req, res, next) => {
    logger.error({ error: err.message, stack: err.stack }, 'Unhandled error');
    res.status(500).json({
        error: 'Internal server error',
        ...(process.env.NODE_ENV !== 'production' && { details: err.message })
    });
});

// Start server
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
    logger.info({ port: PORT }, 'Server started');
});

// Graceful shutdown
const shutdown = async () => {
    logger.info('Received shutdown signal');
    server.close(() => {
        logger.info('HTTP server closed');
    });
    await prisma.$disconnect();
    logger.info('Prisma disconnected');
    process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
