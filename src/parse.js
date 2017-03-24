import fs from 'fs';
import { join as joinPath } from 'path';


const spotifyData = () => {
    const filePath = joinPath(__dirname, `p1_sverigesradio_playlistdata.json`);
    let hepp = fs.readFileSync(filePath);
    let content = JSON.parse(hepp);
    return content;
};

var hell = spotifyData();
console.log();