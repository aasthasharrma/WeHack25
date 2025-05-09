const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Serve static files from the root directory
app.use(express.static(__dirname));

// Serve HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'template/index.html'));
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});