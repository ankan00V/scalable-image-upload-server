const express = require('express');
const dotenv = require('dotenv');
const uploadRoutes = require('./routes/upload');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Health check endpoint for load balancer & CI
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', server: PORT });
});

// Upload route
app.use('/upload', uploadRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
