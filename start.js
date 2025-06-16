const { spawn } = require('child_process');
const chalk = require('chalk');
const config = require('./config');
const ngrok = require('ngrok');

// Function to kill process on a specific port
async function killProcessOnPort(port) {
    const isWindows = process.platform === 'win32';
    const command = isWindows ? 'netstat' : 'lsof';
    const args = isWindows ? ['-ano', '-p', 'TCP'] : ['-i', `:${port}`];
    
    return new Promise((resolve) => {
        const proc = spawn(command, args);
        let output = '';

        proc.stdout.on('data', (data) => {
            output += data.toString();
        });

        proc.on('close', () => {
            if (output) {
                const lines = output.split('\n');
                for (const line of lines) {
                    if (line.includes(`:${port}`)) {
                        const pid = isWindows 
                            ? line.split(/\s+/).pop()
                            : line.split(/\s+/)[1];
                        if (pid) {
                            spawn('taskkill', ['/F', '/PID', pid]);
                        }
                    }
                }
            }
            resolve();
        });
    });
}

// Function to start the server and ngrok
async function startServer() {
    try {
        console.log(chalk.blue('🔄 Checking for existing processes...'));
        await killProcessOnPort(config.server.port);

        console.log(chalk.blue('🚀 Starting ZeroShare server...'));
        const server = spawn('node', ['server.js'], { stdio: 'inherit' });

        // Wait for server to start
        await new Promise(resolve => setTimeout(resolve, 2000));

        console.log(chalk.blue('🌐 Starting ngrok tunnel...'));
        const url = await ngrok.connect({
            addr: config.server.port,
            authtoken_from_env: true // use NGROK_AUTHTOKEN if set
        });

        console.log('\n' + chalk.green('✅ ZeroShare is running!\n'));
        console.log(chalk.cyan('📱 Access your app at:'));
        console.log(`   Local:   http://localhost:${config.server.port}`);
        console.log(`   Public:  ${url}`);
        console.log(`   Download: ${url}/download.html\n`);
        console.log(chalk.yellow('🔒 Security:'));
        console.log('   - Files are encrypted in the browser');
        console.log('   - Server never sees the decryption key');
        console.log('   - Files auto-delete after 1 download or 24 hours\n');
        console.log(chalk.yellow('⚠️  Note:'));
        console.log('   - The ngrok URL will change each time you restart');
        console.log('   - This is a temporary solution for testing\n');
        console.log(chalk.red('🛑 Press Ctrl+C to stop the server and ngrok'));

        // Handle process termination
        process.on('SIGINT', async () => {
            console.log(chalk.yellow('\n🛑 Shutting down...'));
            server.kill();
            await ngrok.disconnect();
            await ngrok.kill();
            process.exit();
        });
    } catch (error) {
        console.error(chalk.red('❌ Error:'), error);
        process.exit(1);
    }
}

startServer().catch(console.error); 
