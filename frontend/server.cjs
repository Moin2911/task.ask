const express = require('express');
const path = require('path');

const app = express();
const distPath = path.join(__dirname, 'dist');
const indexFile = path.join(distPath, 'index.html');
const port = Number(process.env.PORT) || 3000;

app.use(express.static(distPath, { index: false }));

app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(indexFile);
});

app.listen(port, () => {
  console.log(`App running on port ${port}`);
});
