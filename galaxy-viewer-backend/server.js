const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files
app.use('/uploads', express.static('uploads'));
app.use('/songs', express.static('songs'));

// Ensure directories exist
const ensureDirectories = async () => {
  try {
    await fs.mkdir('uploads', { recursive: true });
    await fs.mkdir('songs', { recursive: true });
    await fs.mkdir('data', { recursive: true });
  } catch (error) {
    console.error('Error creating directories:', error);
  }
};

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'song') {
      cb(null, 'songs/');
    } else if (file.fieldname === 'images') {
      cb(null, 'uploads/');
    } else {
      cb(null, 'uploads/');
    }
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'song') {
    // Accept audio files
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed for songs!'), false);
    }
  } else if (file.fieldname === 'images') {
    // Accept image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  } else {
    cb(null, true);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// Galaxy data storage (in production, use a proper database)
let galaxies = new Map();

// Load existing galaxies from file
const loadGalaxies = async () => {
  try {
    const data = await fs.readFile('data/galaxies.json', 'utf8');
    const galaxyArray = JSON.parse(data);
    galaxies = new Map(galaxyArray.map(g => [g.id, g]));
    console.log(`Loaded ${galaxies.size} galaxies from storage`);
  } catch (error) {
    console.log('No existing galaxies file found, starting fresh');
  }
};

// Save galaxies to file
const saveGalaxies = async () => {
  try {
    const galaxyArray = Array.from(galaxies.values());
    await fs.writeFile('data/galaxies.json', JSON.stringify(galaxyArray, null, 2));
  } catch (error) {
    console.error('Error saving galaxies:', error);
  }
};

// Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Get all galaxies (for admin/management)
app.get('/api/galaxies', (req, res) => {
  try {
    const galaxyList = Array.from(galaxies.values()).map(galaxy => ({
      id: galaxy.id,
      textHeart: galaxy.textHeart,
      isHeart: galaxy.isHeart,
      createdAt: galaxy.createdAt,
      messageCount: galaxy.messages?.length || 0,
      imageCount: galaxy.images?.length || 0
    }));
    
    res.json({
      success: true,
      data: galaxyList,
      total: galaxyList.length
    });
  } catch (error) {
    console.error('Error fetching galaxies:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get specific galaxy by ID
app.get('/api/galaxies/:id', (req, res) => {
  try {
    const { id } = req.params;
    const galaxy = galaxies.get(id);
    
    if (!galaxy) {
      return res.status(404).json({
        success: false,
        error: 'Galaxy not found'
      });
    }
    
    res.json({
      success: true,
      data: galaxy
    });
  } catch (error) {
    console.error('Error fetching galaxy:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Create new galaxy
app.post('/api/galaxies', upload.fields([
  { name: 'song', maxCount: 1 },
  { name: 'images', maxCount: 10 }
]), async (req, res) => {
  try {
    const {
      messages,
      icons,
      colors,
      textHeart,
      isHeart
    } = req.body;

    // Validate required fields
    if (!messages || !Array.isArray(JSON.parse(messages))) {
      return res.status(400).json({
        success: false,
        error: 'Messages array is required'
      });
    }

    const galaxyId = uuidv4();
    const parsedMessages = JSON.parse(messages);
    const parsedIcons = icons ? JSON.parse(icons) : ["♥", "💖", "❤️"];
    
    // Process uploaded files
    let songPath = null;
    let imagePaths = [];
    
    if (req.files) {
      if (req.files.song && req.files.song[0]) {
        songPath = `${req.protocol}://${req.get('host')}/songs/${req.files.song[0].filename}`;
      }
      
      if (req.files.images) {
        imagePaths = req.files.images.map(file => 
          `${req.protocol}://${req.get('host')}/uploads/${file.filename}`
        );
      }
    }

    const galaxy = {
      id: galaxyId,
      messages: parsedMessages,
      icons: parsedIcons,
      colors: colors || '#ff6b9d',
      images: imagePaths,
      song: songPath,
      textHeart: textHeart || '',
      isHeart: isHeart === 'true' || isHeart === true,
      isSave: true,
      createdAt: new Date().toISOString()
    };

    galaxies.set(galaxyId, galaxy);
    await saveGalaxies();

    res.status(201).json({
      success: true,
      data: galaxy,
      galaxyUrl: `${req.protocol}://${req.get('host')}/galaxy?id=${galaxyId}`
    });

  } catch (error) {
    console.error('Error creating galaxy:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create galaxy: ' + error.message
    });
  }
});

// Update galaxy
app.put('/api/galaxies/:id', upload.fields([
  { name: 'song', maxCount: 1 },
  { name: 'images', maxCount: 10 }
]), async (req, res) => {
  try {
    const { id } = req.params;
    const existingGalaxy = galaxies.get(id);
    
    if (!existingGalaxy) {
      return res.status(404).json({
        success: false,
        error: 'Galaxy not found'
      });
    }

    const {
      messages,
      icons,
      colors,
      textHeart,
      isHeart
    } = req.body;

    // Process uploaded files
    let songPath = existingGalaxy.song;
    let imagePaths = [...(existingGalaxy.images || [])];
    
    if (req.files) {
      if (req.files.song && req.files.song[0]) {
        songPath = `${req.protocol}://${req.get('host')}/songs/${req.files.song[0].filename}`;
      }
      
      if (req.files.images) {
        const newImages = req.files.images.map(file => 
          `${req.protocol}://${req.get('host')}/uploads/${file.filename}`
        );
        imagePaths = [...imagePaths, ...newImages];
      }
    }

    const updatedGalaxy = {
      ...existingGalaxy,
      messages: messages ? JSON.parse(messages) : existingGalaxy.messages,
      icons: icons ? JSON.parse(icons) : existingGalaxy.icons,
      colors: colors || existingGalaxy.colors,
      images: imagePaths,
      song: songPath,
      textHeart: textHeart !== undefined ? textHeart : existingGalaxy.textHeart,
      isHeart: isHeart !== undefined ? (isHeart === 'true' || isHeart === true) : existingGalaxy.isHeart,
      updatedAt: new Date().toISOString()
    };

    galaxies.set(id, updatedGalaxy);
    await saveGalaxies();

    res.json({
      success: true,
      data: updatedGalaxy
    });

  } catch (error) {
    console.error('Error updating galaxy:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update galaxy: ' + error.message
    });
  }
});

// Delete galaxy
app.delete('/api/galaxies/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const galaxy = galaxies.get(id);
    
    if (!galaxy) {
      return res.status(404).json({
        success: false,
        error: 'Galaxy not found'
      });
    }

    // TODO: Clean up uploaded files
    // This would involve deleting the actual files from disk
    
    galaxies.delete(id);
    await saveGalaxies();

    res.json({
      success: true,
      message: 'Galaxy deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting galaxy:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete galaxy'
    });
  }
});

// Get galaxy statistics
app.get('/api/stats', (req, res) => {
  try {
    const stats = {
      totalGalaxies: galaxies.size,
      totalMessages: Array.from(galaxies.values()).reduce((sum, g) => sum + (g.messages?.length || 0), 0),
      totalImages: Array.from(galaxies.values()).reduce((sum, g) => sum + (g.images?.length || 0), 0),
      galaxiesWithHeart: Array.from(galaxies.values()).filter(g => g.isHeart).length,
      galaxiesWithSong: Array.from(galaxies.values()).filter(g => g.song).length
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large. Maximum size is 50MB.'
      });
    }
  }
  
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Initialize and start server
const startServer = async () => {
  await ensureDirectories();
  await loadGalaxies();
  
  app.listen(PORT, () => {
    console.log(`🚀 Galaxy Viewer API server running on port ${PORT}`);
    console.log(`📊 Loaded ${galaxies.size} galaxies`);
    console.log(`🌐 Health check: http://localhost:${PORT}/health`);
  });
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Saving data before shutdown...');
  await saveGalaxies();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Saving data before shutdown...');
  await saveGalaxies();
  process.exit(0);
});

startServer().catch(console.error);

module.exports = app;