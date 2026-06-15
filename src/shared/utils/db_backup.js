const { exec } = require('child_process');
const path = require('path');
const fs = require('fs-extra');
const moment = require('moment');
const B2 = require('b2-node-sdk');
require('dotenv').config();

// Initialize Backblaze B2
const b2 = new B2({
    accountId: process.env.B2_ACCOUNT_ID,
    applicationKey: process.env.B2_APPLICATION_KEY,
});

// Set the database name and backup path
const dbName = 'yourDatabaseName';
const backupDir = path.join(__dirname, 'backups');

// Create a timestamp for the backup
const timestamp = moment().format('YYYYMMDD_HHmmss');
const backupFileName = `${dbName}_backup_${timestamp}.gz`;
const backupFilePath = path.join(backupDir, backupFileName);

// Ensure the backup directory exists
fs.ensureDirSync(backupDir);

// Command to backup the database
const command = `mongodump --db=${dbName} --archive=${backupFilePath} --gzip`;

// Execute the backup command
exec(command, async (error, stdout, stderr) => {
    if (error) {
        console.error(`Backup failed: ${stderr}`);
        return;
    }

    console.log(`Backup successful: ${backupFilePath}`);

    // Authenticate with Backblaze B2
    try {
        await b2.authorize();
        console.log('B2 authorization successful');

        // Upload the backup file to Backblaze B2
        const uploadResult = await b2.uploadFile({
            bucketId: process.env.B2_BUCKET_NAME,
            fileName: backupFileName,
            filePath: backupFilePath,
        });

        console.log('File uploaded successfully:', uploadResult);
    } catch (err) {
        console.error('Error uploading to B2:', err);
    } finally {
        // Optionally remove the local backup file after upload
        fs.removeSync(backupFilePath);
    }
});

// npm install b2-node-sdk moment child_process fs-extra
//npm install node-cron
const cron = require('node-cron');

// Schedule a task to run the backup script daily at 2 AM
cron.schedule('0 2 * * *', () => {
    // Call the backup function or execute the backup script
});
