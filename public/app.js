// Utility functions for encryption
async function generateKey() {
    return await window.crypto.subtle.generateKey(
        {
            name: "AES-GCM",
            length: 256
        },
        true,
        ["encrypt", "decrypt"]
    );
}

async function encryptFile(file, key) {
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const fileBuffer = await file.arrayBuffer();
    
    const encryptedData = await window.crypto.subtle.encrypt(
        {
            name: "AES-GCM",
            iv: iv
        },
        key,
        fileBuffer
    );

    const exportedKey = await window.crypto.subtle.exportKey(
        "raw",
        key
    );

    const encryptedFile = new Blob(
        [iv, new Uint8Array(encryptedData)],
        { type: 'application/octet-stream' }
    );

    const keyBase64 = btoa(String.fromCharCode(...new Uint8Array(exportedKey)));
    
    return {
        encryptedFile,
        keyBase64
    };
}

async function decryptFile(encryptedData, keyBase64) {
    // Convert base64 key back to ArrayBuffer
    const keyData = Uint8Array.from(atob(keyBase64), c => c.charCodeAt(0));
    
    // Import the key
    const key = await window.crypto.subtle.importKey(
        "raw",
        keyData,
        {
            name: "AES-GCM",
            length: 256
        },
        false,
        ["decrypt"]
    );

    // Extract IV and encrypted data
    const encryptedArray = new Uint8Array(await encryptedData.arrayBuffer());
    const iv = encryptedArray.slice(0, 12);
    const data = encryptedArray.slice(12);

    // Decrypt the data
    const decryptedData = await window.crypto.subtle.decrypt(
        {
            name: "AES-GCM",
            iv: iv
        },
        key,
        data
    );

    return new Blob([decryptedData]);
}

// DOM Elements
const dropArea = document.getElementById('drop-area');
const fileInput = document.getElementById('file-input');
const filePreview = document.getElementById('file-preview');
const fileName = document.querySelector('.file-name');
const fileSize = document.querySelector('.file-size');
const encryptButton = document.getElementById('encrypt-button');
const progressContainer = document.querySelector('.progress-container');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');
const uploadSection = document.getElementById('upload-section');
const shareSection = document.getElementById('share-section');
const shareLink = document.getElementById('share-link');
const copyButton = document.getElementById('copy-button');
const toast = document.getElementById('toast');

// Prevent default drag behaviors
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, preventDefaults, false);
    document.body.addEventListener(eventName, preventDefaults, false);
});

// Highlight drop area when item is dragged over it
['dragenter', 'dragover'].forEach(eventName => {
    dropArea.addEventListener(eventName, highlight, false);
});

['dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, unhighlight, false);
});

// Handle dropped files
dropArea.addEventListener('drop', handleDrop, false);

// Handle click to upload
dropArea.addEventListener('click', () => {
    fileInput.click();
});

// Handle file selection
fileInput.addEventListener('change', handleFiles);

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function highlight(e) {
    dropArea.classList.add('drag-over');
}

function unhighlight(e) {
    dropArea.classList.remove('drag-over');
}

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles({ target: { files } });
}

function handleFiles(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Show file preview
    fileName.textContent = file.name;
    fileSize.textContent = formatFileSize(file.size);
    filePreview.style.display = 'flex';
    encryptButton.style.display = 'inline-flex';
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Handle file upload
encryptButton.addEventListener('click', async () => {
    const file = fileInput.files[0];
    if (!file) return;

    try {
        // Show progress
        progressContainer.style.display = 'block';
        encryptButton.disabled = true;

        // Create form data
        const formData = new FormData();
        formData.append('file', file);

        // Upload file
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
            onUploadProgress: (progressEvent) => {
                const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                progressBar.style.width = percentCompleted + '%';
                progressText.textContent = `${percentCompleted}%`;
            }
        });

        if (!response.ok) {
            throw new Error('Upload failed');
        }

        const data = await response.json();
        
        // Show share section
        uploadSection.style.display = 'none';
        shareSection.style.display = 'block';
        shareLink.value = `${window.location.origin}/download/${data.id}`;
        
        showToast('File uploaded successfully!', 'success');
    } catch (error) {
        console.error('Upload error:', error);
        showToast('Upload failed. Please try again.', 'error');
        encryptButton.disabled = false;
    }
});

// Handle copy button
copyButton.addEventListener('click', () => {
    shareLink.select();
    document.execCommand('copy');
    showToast('Link copied to clipboard!', 'success');
});

// Toast notification
function showToast(message, type) {
    toast.textContent = message;
    toast.className = `toast toast-${type}`;
    toast.classList.remove('hidden');
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
} 