# ZeroShare

A secure file sharing application with client-side encryption, built with Node.js and Express.

## Features

- 🔒 Client-side encryption using AES-GCM
- 🔗 Unique, secure download links
- ⏱️ Automatic file expiration
- 🚫 One-time download links
- 🔄 Real-time upload/download progress
- 📋 Copy to clipboard functionality
- 🎯 Drag and drop file upload

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas cluster)
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/zeroshare.git
cd zeroshare
```

2. Install dependencies:
```bash
npm install
```

3. Create a `config.js` file in the root directory with your configuration:
```javascript
module.exports = {
    app: {
        name: 'ZeroShare',
        description: 'Secure file sharing with client-side encryption',
        version: '1.0.0',
        maxFileSize: 100 * 1024 * 1024, // 100MB
        supportedFileTypes: '*' // All file types
    },
    security: {
        encryptionAlgorithm: 'AES-GCM',
        keyLength: 256,
        fileExpiry: 24, // hours
        maxDownloads: 1
    },
    database: {
        uri: 'your_mongodb_connection_string'
    },
    server: {
        port: 3000,
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
            allowedHeaders: ['Content-Type']
        }
    }
};
```

4. Create an `uploads` directory in the root folder:
```bash
mkdir uploads
```

## Usage

1. Start the development server:
```bash
npm run dev
```

2. For production:
```bash
npm start
```

3. To share the application temporarily (using ngrok):
```bash
npm run share
```

## How It Works

1. **File Upload**:
   - User selects a file through the UI
   - File is encrypted client-side using AES-GCM
   - Encrypted file is uploaded to the server
   - A unique download link is generated

2. **File Download**:
   - User receives the download link
   - Link contains the file ID and encryption key
   - File is downloaded and decrypted client-side
   - File is automatically deleted after download

## Security Features

- Client-side encryption ensures files are never stored in plain text
- One-time download links prevent unauthorized access
- Automatic file expiration after 24 hours
- Secure key transmission through URL hash
- No server-side decryption

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Express.js](https://expressjs.com/)
- [MongoDB](https://www.mongodb.com/)
- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
- [Font Awesome](https://fontawesome.com/)
- [Google Fonts](https://fonts.google.com/) 
