module.exports = {
    // App Settings
    app: {
        name: 'ZeroShare',
        description: 'Secure file sharing with client-side encryption',
        version: '1.0.0',
        maxFileSize: 100 * 1024 * 1024, // 100MB
        supportedFileTypes: '*' // All file types
    },

    // Security Settings
    security: {
        encryptionAlgorithm: 'AES-GCM',
        keyLength: 256,
        fileExpiry: 24, // hours
        maxDownloads: 1
    },

    // UI Settings
    ui: {
        theme: {
            primary: '#3B82F6',    // Blue
            secondary: '#10B981',  // Green
            accent: '#8B5CF6',     // Purple
            background: '#F3F4F6', // Light Gray
            text: '#1F2937',       // Dark Gray
        },
        features: {
            dragAndDrop: true,
            progressBar: true,
            filePreview: true,
            copyToClipboard: true,
        }
    },

    // Server Settings
    server: {
        port: 3000,
        uploadDir: 'uploads',
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
            allowedHeaders: ['Content-Type']
        },
        database: {
            uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/zeroshare'
        }
    }
}; 