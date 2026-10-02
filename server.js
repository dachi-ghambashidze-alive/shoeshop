const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Resolve build directory dynamically for Angular CLI output structures
let distPath = path.join(__dirname, 'dist/shoe-store/browser');
if (!fs.existsSync(distPath)) {
  distPath = path.join(__dirname, 'dist/shoe-store');
}

// Serve static assets from the Angular build
app.use(express.static(distPath));

// API endpoint for products
app.get('/api/shoes', (req, res) => {
  res.json([
    { id: 1, name: 'Aero-Stark V1', price: 195, stock: 12 },
    { id: 2, name: 'Geo-Form X', price: 220, stock: 8 },
    { id: 3, name: 'Void Runner', price: 180, stock: 24 }
  ]);
});

// Single-page fallback route
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Shoe storefront server running on http://localhost:${PORT}`);
});