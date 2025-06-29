
// File Upload Routes
// Single file upload endpoint
app.post('/upload', upload.single('file'), (req, res) => {
  try {
    // console.log(req.file);
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    // console.log(fileUrl);
    res.json({
      message: 'File uploaded successfully',
      fileUrl,
      fileType: req.file.mimetype,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Upload failed', error: error.message });
  }
});

// Multiple files upload endpoint
app.post('/uploads', upload.array('files', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const fileInfos = req.files.map(file => ({
      originalName: file.originalname,
      fileName: file.filename,
      fileUrl: `${req.protocol}://${req.get('host')}/uploads/${file.filename}`,
      fileType: file.mimetype,
      size: file.size
    }));

    res.json({
      message: 'Files uploaded successfully',
      files: fileInfos
    });
  } catch (error) {
    console.error('Multiple upload error:', error);
    res.status(500).json({ message: 'Upload failed', error: error.message });
  }
});

// Delete file endpoint
app.delete('/delete/:filename', (req, res) => {
  try {
    const { filename } = req.params;

    // Prevent directory traversal attacks
    const safeFilename = path.basename(filename);
    const filePath = path.join(__dirname, 'uploads', safeFilename);

    // Check if file exists
    fs.access(filePath, fs.constants.F_OK, (err) => {
      if (err) {
        return res.status(404).json({ message: 'File not found' });
      }

      // Delete the file
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error('Delete error:', err);
          return res.status(500).json({ message: 'Error deleting file' });
        }

        res.json({ message: 'File deleted successfully' });
      });
    });
  } catch (error) {
    console.error('Delete endpoint error:', error);
    res.status(500).json({ message: 'Delete failed', error: error.message });
  }
});

// Get file info endpoint
app.get('/file/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const safeFilename = path.basename(filename);
    const filePath = path.join(__dirname, 'uploads', safeFilename);

    fs.stat(filePath, (err, stats) => {
      if (err) {
        return res.status(404).json({ message: 'File not found' });
      }

      res.json({
        filename: safeFilename,
        size: stats.size,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime,
        fileUrl: `${req.protocol}://${req.get('host')}/uploads/${safeFilename}`
      });
    });
  } catch (error) {
    console.error('File info error:', error);
    res.status(500).json({ message: 'Failed to get file info', error: error.message });
  }
});