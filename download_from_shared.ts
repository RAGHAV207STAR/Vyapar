import https from 'https';
import fs from 'fs';
import url from 'url';

function fetchUrlAndFollow(targetUrl: string) {
  console.log('Fetching:', targetUrl);
  const options = {
    headers: {
      'User-Agent': 'Mozilla/5.0'
    }
  };
  
  https.get(targetUrl, options, (res) => {
    console.log('Status code:', res.statusCode);
    console.log('Headers:', res.headers);
    
    if (res.statusCode === 301 || res.statusCode === 302) {
      let redirectUrl = res.headers.location;
      if (redirectUrl) {
        if (!redirectUrl.startsWith('http')) {
          const parsed = url.parse(targetUrl);
          redirectUrl = `${parsed.protocol}//${parsed.host}${redirectUrl}`;
        }
        console.log('Following redirect to:', redirectUrl);
        fetchUrlAndFollow(redirectUrl);
      }
      return;
    }
    
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('HTML Length:', data.length);
      fs.writeFileSync('shared_index.html', data);
      console.log('Saved to shared_index.html');
      
      // Look for script tags
      const regex = /<script\s+[^>]*src="([^"]+)"/g;
      let match;
      while ((match = regex.exec(data)) !== null) {
        console.log('Found script tag src:', match[1]);
      }
    });
  }).on('error', e => console.error('Error fetching:', e.message));
}

const sharedUrl = 'https://ais-pre-n6p7nzyasm6nifp4xyiedm-989624052375.asia-southeast1.run.app/';
fetchUrlAndFollow(sharedUrl);
