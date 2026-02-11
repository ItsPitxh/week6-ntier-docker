// server.js
// Main entry point for Task Board API
// ENGSE207 - Week 6 Docker Version

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { healthCheck } = require('./src/config/database');
const taskRoutes = require('./src/routes/taskRoutes');
const { errorHandler, notFoundHandler } = require('./src/middleware/errorHandler');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// Middleware
// ============================================

// CORS - อนุญาต requests จาก Nginx
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(morgan('combined'));

// ============================================
// Routes
// ============================================

// Health check endpoint (สำหรับ Docker health check)
app.get('/api/health', async (req, res) => {
    const dbHealth = await healthCheck();
    const healthy = dbHealth.status === 'healthy';
    
    res.status(healthy ? 200 : 503).json({
        status: healthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        environment: process.env.NODE_ENV || 'development',
        database: dbHealth
    });
});

// API info
app.get('/api', (req, res) => {
    res.json({
        name: 'Task Board API',
        version: '2.0.0',
        description: 'ENGSE207 Week 6 - N-Tier Architecture (Docker)',
        endpoints: {
            health: 'GET /api/health',
            tasks: {
                list: 'GET /api/tasks',
                get: 'GET /api/tasks/:id',
                create: 'POST /api/tasks',
                update: 'PUT /api/tasks/:id',
                delete: 'DELETE /api/tasks/:id',
                stats: 'GET /api/tasks/stats'
            }
        }
    });
});

// Task routes
app.use('/api/tasks', taskRoutes);

// ============================================
// Error Handling
// ============================================

app.use(notFoundHandler);
app.use(errorHandler);

// ============================================
// Start Server
// ============================================

// Wait for database connection before starting
const startServer = async () => {
    try {
        // Test database connection
        const dbHealth = await healthCheck();
        if (dbHealth.status !== 'healthy') {
            console.error('❌ Database connection failed:', dbHealth.error);
            console.log('⏳ Waiting for database...');
            // Retry after 5 seconds
            setTimeout(startServer, 5000);
            return;
        }

        app.listen(PORT, '0.0.0.0', () => {
            console.log('=========================================');
            console.log('🚀 Task Board API Started');
            console.log('=========================================');
            console.log(`📡 Server running on port ${PORT}`);
            console.log(`🗄️  Database: ${dbHealth.database}`);
            console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log('=========================================');
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error.message);
        setTimeout(startServer, 5000);
    }
};

startServer();
