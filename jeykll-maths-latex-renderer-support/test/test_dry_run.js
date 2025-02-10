const { spawn } = require('child_process');
const path = require('path');

async function dryRun() {
    console.log('Starting dry run test...');

    // Spawn the main process
    const serverProcess = spawn('node', [
        path.resolve(__dirname, '../tex2svg_renderer/index.js')
    ], {
        stdio: ['pipe', 'pipe', 'pipe']
    });

    // Handle server output
    serverProcess.stdout.on('data', (data) => {
        const response = data.toString().trim();
        if (response) {
            try {
                const parsed = JSON.parse(response);
                console.log('\nServer Response:', JSON.stringify(parsed, null, 2));
                
                if (parsed.result && parsed.result.svg) {
                    console.log('SVG received! Length:', parsed.result.svg.length);
                }
            } catch (e) {
                console.log('Raw output:', response);
            }
        }
    });

    serverProcess.stderr.on('data', (data) => {
        console.error('Server Error:', data.toString());
    });

    // Wait for server to initialize
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test cases
    const testCases = [
        {
            jsonrpc: '2.0',
            id: 1,
            method: 'ping'
        },
        {
            jsonrpc: '2.0',
            id: 2,
            method: 'renderMath',
            params: {
                latex: 'E = mc^2',
                display: true
            }
        },
        {
            jsonrpc: '2.0',
            id: 3,
            method: 'renderMath',
            params: {
                latex: '\\frac{1}{2}',
                display: false
            }
        }
    ];

    // Send test cases
    for (const testCase of testCases) {
        console.log('\nSending request:', JSON.stringify(testCase, null, 2));
        serverProcess.stdin.write(JSON.stringify(testCase) + '\n');
        // Wait between requests
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Cleanup after tests
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('\nTests completed, shutting down...');
    serverProcess.kill();
}

// Run the dry test
dryRun().catch(console.error);
