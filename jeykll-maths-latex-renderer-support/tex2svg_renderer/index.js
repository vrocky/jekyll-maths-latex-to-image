#!/usr/bin/env node

const fs = require('fs');
const { getServerConfig } = require('./impl/config');
const MathServer = require('./impl/math_server');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
    try {
        const serverConfig = getServerConfig();
        fs.mkdirSync(serverConfig.debugDir, { recursive: true });

        const server = new MathServer(serverConfig);
        await server.start();
        
        ['SIGINT', 'SIGTERM', 'SIGHUP'].forEach(signal => {
            process.on(signal, async () => {
                process.stderr.write(`\nReceived ${signal}. Shutting down...\n`);
                await server.stop();
                await sleep(1000); // Give time for cleanup
                process.exit(0);
            });
        });

        process.on('uncaughtException', async (error) => {
            process.stderr.write(`Uncaught Exception: ${error}\n`);
            await server.stop();
            await sleep(1000); // Give time for cleanup
            process.exit(1);
        });

    } catch (error) {
        process.stderr.write(`Failed to start server: ${error.message}\n`);
        await sleep(1000); // Give time for error logging
        process.exit(1);
    }
}

if (require.main === module) {
    main().catch(async error => {
        process.stderr.write(`Fatal error: ${error}\n`);
        await sleep(1000); // Give time for error logging
        process.exit(1);
    });
}

module.exports = main;
