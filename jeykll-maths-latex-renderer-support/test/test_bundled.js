const { spawn } = require('child_process');
const path = require('path');

async function testBundled() {
    console.log('Starting bundled version test...');

    const bundlePath = path.resolve(__dirname, '../dist/tex2svg_renderer__index.bundled.js');
    
    // Verify bundle exists
    try {
        require('fs').accessSync(bundlePath);
        console.log('Found bundle at:', bundlePath);
    } catch (error) {
        console.error('Bundle not found! Please ensure it is built first.');
        process.exit(1);
    }

    // Spawn the bundled process
    const serverProcess = spawn('node', [bundlePath], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
            ...process.env,
            BASE_DIR: path.resolve(__dirname, '..'),
            LOG_DIR: '_test_logs',
            DEBUG_DIR: '_test_debug'
        }
    });

    // Handle server output
    serverProcess.stdout.on('data', (data) => {
        const response = data.toString().trim();
        if (response) {
            try {
                const parsed = JSON.parse(response);
                console.log('\nServer Response:', JSON.stringify(parsed, null, 2));
                
                if (parsed.result && parsed.result.svg) {
                    const svgData = Buffer.from(parsed.result.svg, 'base64').toString();
                    console.log('SVG received! First 100 chars:', svgData.substring(0, 100));
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
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Complex test cases for the bundled version
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
                latex: '\\int_{0}^{\\infty} e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}',
                display: true
            }
        },
        {
            jsonrpc: '2.0',
            id: 3,
            method: 'renderMath',
            params: {
                latex: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}',
                display: true
            }
        },
        {
            jsonrpc: '2.0',
            id: 4,
            method: 'renderMath',
            params: {
                latex: '\\sum_{n=1}^{\\infty} \\frac{1}{n^2} = \\frac{\\pi^2}{6}',
                display: true
            }
        }
    ];

    // Send test cases
    for (const testCase of testCases) {
        console.log('\nSending request:', JSON.stringify(testCase, null, 2));
        serverProcess.stdin.write(JSON.stringify(testCase) + '\n');
        // Longer wait for complex equations
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Cleanup after tests
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('\nBundled tests completed, shutting down...');
    serverProcess.kill();
}

// Run the bundled test
testBundled().catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
});
