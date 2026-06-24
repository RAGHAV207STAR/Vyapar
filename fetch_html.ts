import https from 'https';

https.get('https://ais-pre-n6p7nzyasm6nifp4xyiedm-989624052375.asia-southeast1.run.app/', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const match = data.match(/<script type="module" crossorigin src="([^"]+)"><\/script>/);
    if (match) {
      console.log('Script URL:', match[1]);
    } else {
      console.log('No script tag found:', data);
    }
  });
});
