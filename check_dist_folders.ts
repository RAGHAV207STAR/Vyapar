import fs from 'fs';
import path from 'path';

function findDist() {
    const cwd = process.cwd();
    console.log("cwd:", cwd);
    console.log("cwd absolute dist exists?", fs.existsSync('/dist'));
    console.log("cwd relative dist exists?", fs.existsSync('./dist'));
    console.log("parent relative dist exists?", fs.existsSync('../dist'));
    
    // List parent directory files
    try {
        console.log("parent contents:", fs.readdirSync('..'));
        if (fs.existsSync('../dist')) {
            console.log("parent dist contents:", fs.readdirSync('../dist'));
        }
    } catch(e) {}
}
findDist();
