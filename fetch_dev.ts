import https from 'https';

https.get('https://ais-dev-n6p7nzyasm6nifp4xyiedm-989624052375.asia-southeast1.run.app/', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
      console.log('HTML:', data.substring(0, 500));
  });
});
