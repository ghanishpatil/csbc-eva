import { getFirestore } from '../utils/firebase.js';

/**
 * Health check with detailed metrics
 * @route GET /api/health
 */
export const getHealthStatus = async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Check Firestore connection
    let dbStatus = 'ok';
    let dbLatency = 0;
    try {
      const db = getFirestore();
      const healthCheckStart = Date.now();
      // Simple read to test connection
      await db.collection('config').limit(1).get();
      dbLatency = Date.now() - healthCheckStart;
      dbStatus = 'ok';
    } catch (error) {
      dbStatus = 'error';
      console.error('[HealthController] Database check failed:', error.message);
    }

    const totalLatency = Date.now() - startTime;

    // Get memory usage
    const memoryUsage = process.memoryUsage();
    const memoryMB = {
      rss: Math.round(memoryUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      external: Math.round(memoryUsage.external / 1024 / 1024),
    };

    // Determine overall health status
    const isHealthy = dbStatus === 'ok' && totalLatency < 5000;
    const status = isHealthy ? 'healthy' : 'degraded';

    const health = {
      status,
      timestamp: new Date().toISOString(),
      uptime: Math.round(process.uptime()),
      services: {
        database: {
          status: dbStatus,
          latency: dbLatency,
        },
        backend: {
          status: 'ok',
          latency: totalLatency,
        },
      },
      system: {
        memory: memoryMB,
        nodeVersion: process.version,
        platform: process.platform,
      },
      version: process.env.npm_package_version || '1.0.0',
    };

    const statusCode = isHealthy ? 200 : 503;
    return res.status(statusCode).json(health);
  } catch (error) {
    console.error('[HealthController] Health check error:', error);
    return res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
    });
  }
};

