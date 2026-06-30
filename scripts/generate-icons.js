const fs = require('fs');
const { createCanvas } = require('canvas');

function createIcon(filename, isActive) {
  const size = 128;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  ctx.clearRect(0, 0, size, size);
  
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2 - 4, 0, Math.PI * 2);
  ctx.fillStyle = isActive ? '#00cc44' : '#888888';
  ctx.fill();
  
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 48px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('¼ì', size / 2, size / 2 - 8);
  
  const dotX = size - 24;
  const dotY = 24;
  const dotR = 14;
  
  ctx.beginPath();
  ctx.arc(dotX, dotY, dotR, 0, Math.PI * 2);
  ctx.fillStyle = isActive ? '#00ff00' : '#cccccc';
  ctx.fill();
  
  if (isActive) {
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.stroke();
  }
  
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(filename, buffer);
  console.log(`Created ${filename}`);
}

createIcon('icon-inactive.png', false);
createIcon('icon-active.png', true);