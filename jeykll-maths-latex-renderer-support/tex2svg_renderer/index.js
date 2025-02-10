#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const MathServer = require('./impl/math_server');

async function main() {
    // Make IO streams explicit
    const io = {
        inputStream: process.stdin,
        outputStream: process.stdout
    };

    // Resolve all paths at entry point
    const baseDir = process.env.BASE_DIR || process.cwd();
    const logDir = path.resolve(baseDir, process.env.LOG_DIR || '__logs');
    const debugDir = path.resolve(baseDir, process.env.DEBUG_DIR || '__debug');
    
    // Create specific subdirectories for math processing
    const mathLogDir = path.join(logDir, 'math');
    const mathDebugDir = path.join(debugDir, 'math', 'node');

    // Log resolved paths for better visibility
    console.log('Resolved paths:');
    console.log('- Base directory:', baseDir);
    console.log('- Log directory:', mathLogDir);
    console.log('- Debug directory:', mathDebugDir);

    // Required configuration with resolved paths
    const serverConfig = {
        baseDir,
        logDir: mathLogDir,
        debugDir: mathDebugDir,
        ...io
    };

    // Ensure directories exist
    [mathLogDir, mathDebugDir].forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            console.log('Created directory:', dir);
        }
    });

    const server = new MathServer(serverConfig);

    try {
        await server.start();
        
        // Handle process signals
        const signals = ['SIGINT', 'SIGTERM', 'SIGHUP'];
        signals.forEach(signal => {
            process.on(signal, async () => {
                console.log(`\nReceived ${signal}. Shutting down...`);
                await server.stop();
                process.exit(0);
            });
        });

        // Handle uncaught errors
        process.on('uncaughtException', async (error) => {
            console.error('Uncaught Exception:', error);
            await server.stop();
            process.exit(1);
        });

        process.on('unhandledRejection', async (reason, promise) => {
            console.error('Unhandled Rejection at:', promise, 'reason:', reason);
            await server.stop();
            process.exit(1);
        });

    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Start the server
if (require.main === module) {
    main().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = main;
