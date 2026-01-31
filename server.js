import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, 'data', 'data.json');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json());

// Ensure directories exist
async function ensureDirs() {
  try {
    await fs.access(path.dirname(DATA_FILE));
  } catch {
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  }
  try {
    await fs.access(UPLOADS_DIR);
  } catch {
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
  }
}
ensureDirs();

// Serve static files from uploads directory
app.use('/uploads', express.static(UPLOADS_DIR));

// Configure multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOADS_DIR)
  },
  filename: function (req, file, cb) {
    // Keep original extension, add timestamp for uniqueness
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// Read data from file
app.get('/api/data', async (req, res) => {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    res.json(JSON.parse(data));
  } catch (error) {
    if (error.code === 'ENOENT') {
      return res.json({ projects: [], labels: [], tasks: [] });
    }
    res.status(500).json({ error: 'Failed to read data' });
  }
});

// Save data to file
app.post('/api/data', async (req, res) => {
  try {
    await fs.writeFile(DATA_FILE, JSON.stringify(req.body, null, 2), 'utf-8');
    res.json({ success: true });
  } catch (error) {
    console.error('Save error:', error);
    res.status(500).json({ error: 'Failed to save data' });
  }
});

// Upload endpoint
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  // Return the path that the frontend can use to access the file
  res.json({ 
    url: `/uploads/${req.file.filename}`,
    filename: req.file.originalname,
    mimetype: req.file.mimetype
  });
});

app.listen(PORT, () => {
  console.log(`Data server running at http://localhost:${PORT}`);
});
