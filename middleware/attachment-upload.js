const multer = require("multer");
const fs = require("fs");
const path = require("path");

// Define the path to the CDN attachments folder
const CDN_ATTACHMENTS_DIR = path.join(__dirname, '../../../rh-cdn/attachments');
const CDN_BASE_URL = process.env.CDN_BASE_URL || 'https://rh-helpdesk-server-new.rhodesislandpass.com';

module.exports = async (req, res, next) => {
  // Ensure the CDN attachments directory exists
  if (!fs.existsSync(CDN_ATTACHMENTS_DIR)) {
    fs.mkdirSync(CDN_ATTACHMENTS_DIR, { recursive: true });
    console.log(`Created CDN attachments directory at: ${CDN_ATTACHMENTS_DIR}`);
  }
  
  // Configure multer to store files directly in the CDN attachments folder
  const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, CDN_ATTACHMENTS_DIR); // Store files directly in the CDN folder
    },
    filename: (req, file, cb) => {
      // Create unique filename with date prefix
      const filename = new Date().toISOString().replace(/:/g, '-') + "-" + file.originalname;
      cb(null, filename);
    },
  });

  const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = [
      "image/png",
      "image/jpg",
      "image/jpeg",
      "application/pdf",
      "video/mp4",
      "video/quicktime",
      "video/x-ms-wmv",
      "video/x-msvideo",
      "video/x-flv",
      "video/webm",
      "video/3gpp",
      "video/3gpp2",
      "video/avi",
      "video/mpeg",
      "video/ogg",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
      "application/msword", // .doc
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
      "application/vnd.ms-excel", // .xls
      "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx
      "application/vnd.ms-powerpoint", // .ppt
      "application/vnd.google-apps.spreadsheet", // Google Sheets
      "application/vnd.google-apps.document", // Google Docs
      "application/vnd.google-apps.presentation", // Google Slides
      "application/vnd.google-apps.form", // Google Forms
      "application/vnd.google-apps.script", // Google Apps Script
      "application/vnd.google-apps.drawing", // Google Drawings
      "application/zip", // .zip
      "application/x-rar-compressed", // .rar
      "application/x-tar", // .tar
      "application/x-7z-compressed", // .7z
      "application/x-gzip", // .gz
      "application/x-bzip2", // .bz2
      "application/x-xz", // .xz
      "application/octet-stream", // .bin
      "application/x-msdownload", // .exe
      "application/vnd.android.package-archive", // .apk
      "application/x-apple-diskimage", // .dmg
      "application/x-debian-package", // .deb
      "application/x-redhat-package-manager", // .rpm
      "application/x-shockwave-flash", // .swf
      "application/x-java-archive", // .jar
      "application/x-rar", // .rar
      "application/vnd.apple.pages", // .pages
      "application/vnd.apple.numbers", // .numbers
      "application/vnd.apple.keynote", // .keynote
      "application/json",
      "text/csv",
      "text/plain",
      "application/rtf",
      "application/vnd.oasis.opendocument.text", // .odt
      "application/vnd.oasis.opendocument.spreadsheet", // .ods
      "application/vnd.oasis.opendocument.presentation", // .odp
      "application/vnd.oasis.opendocument.graphics", // .odg
      "application/vnd.oasis.opendocument.formula", // .odf
      "image/webp",
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  };

  const upload = multer({ storage: fileStorage, fileFilter: fileFilter }).array(
    "attachments"
  );

  // Handle the upload directly
  upload(req, res, async (err) => {
    if (err) {
      console.error('Multer upload error:', err);
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      return next(err);
    }

    try {
      // If no files were uploaded, move to the next middleware
      if (!req.files || req.files.length === 0) {
        return next();
      }
      
      console.log(`Successfully uploaded ${req.files.length} files to ${CDN_ATTACHMENTS_DIR}`);
      
      // Format the files with CDN URLs
      req.cdnFiles = req.files.map(file => {
        const url = `/attachments/${file.filename}`;
        
        return {
          filename: file.filename,
          url: url,
          originalName: file.originalname,
          size: file.size,
          mimeType: file.mimetype
        };
      });
      
      // Add the CDN URLs to the original file objects
      req.files = req.files.map((file, index) => {
        return {
          ...file,
          cdnUrl: req.cdnFiles[index].url,
        };
      });
      
      next();
    } catch (error) {
      console.error('Attachment processing error:', error);
      if (!error.statusCode) {
        error.statusCode = 500;
      }
      next(error);
    }
  });
};