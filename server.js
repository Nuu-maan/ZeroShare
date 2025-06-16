require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const config = require('./config');

const app = express();
const port = process.env.PORT || config.server.port;

// Middleware
app.use(cors(config.server.cors));
app.use(express.json());
app.use(express.static('public'));

// MongoDB connection
mongoose.connect(config.server.database.uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB');
}).catch(err => {
    console.error('MongoDB connection error:', err);
});

// File Schema
const fileSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    size: { type: Number, required: true },
    mimeType: { type: String, required: true },
    uploadDate: { type: Date, default: Date.now },
    expiryDate: { type: Date, required: true },
    downloads: { type: Number, default: 0 },
    maxDownloads: { type: Number, default: config.security.maxDownloads }
});

const File = mongoose.model('File', fileSchema);

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueId = uuidv4();
        cb(null, uniqueId + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: config.app.maxFileSize
    }
});

// API Routes
app.post('/api/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const fileId = path.parse(req.file.filename).name;
        const expiryDate = new Date();
        expiryDate.setHours(expiryDate.getHours() + config.security.fileExpiry);

        const file = new File({
            id: fileId,
            filename: req.file.filename,
            originalName: req.file.originalname,
            size: req.file.size,
            mimeType: req.file.mimetype,
            expiryDate: expiryDate
        });

        await file.save();
        res.json({ id: fileId });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Upload failed' });
    }
});

app.get('/api/download/:id', async (req, res) => {
    try {
        const file = await File.findOne({ id: req.params.id });
        
        if (!file) {
            return res.status(404).json({ error: 'File not found' });
        }

        if (file.downloads >= file.maxDownloads) {
            return res.status(403).json({ error: 'Maximum downloads reached' });
        }

        if (new Date() > file.expiryDate) {
            return res.status(403).json({ error: 'File has expired' });
        }

        const filePath = path.join(__dirname, 'uploads', file.filename);
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'File not found on server' });
        }

        // Increment download count
        file.downloads += 1;
        await file.save();

        // Set headers for file download
        res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
        res.setHeader('Content-Type', file.mimeType);

        // Stream the file
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);

        // Delete file if max downloads reached
        if (file.downloads >= file.maxDownloads) {
            fs.unlink(filePath, (err) => {
                if (err) console.error('Error deleting file:', err);
            });
        }
    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ error: 'Download failed' });
    }
});

// Cleanup expired files
async function cleanupExpiredFiles() {
    try {
        const expiredFiles = await File.find({
            $or: [
                { expiryDate: { $lt: new Date() } },
                { downloads: { $gte: '$maxDownloads' } }
            ]
        });

        for (const file of expiredFiles) {
            const filePath = path.join(__dirname, 'uploads', file.filename);
            if (fs.existsSync(filePath)) {
                fs.unlink(filePath, (err) => {
                    if (err) console.error('Error deleting file:', err);
                });
            }
            await File.deleteOne({ _id: file._id });
        }
    } catch (error) {
        console.error('Cleanup error:', error);
    }
}

// Run cleanup every hour
setInterval(cleanupExpiredFiles, 60 * 60 * 1000);

// Start server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
}); 