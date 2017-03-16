import SpotifyWebApi from 'spotify-web-api-node';
import secrets from './secrets';
import fs from 'fs';
import { join as joinPath } from 'path';

const spotifyApi = new SpotifyWebApi(secrets.spotify);
const user = 'p1_sverigesradio';
const myDataObject = {};
const maxLimit = 50;

const getPlaylistsSleepTime = 5;
const getTracksSleepTime = 100;

let getPlaylistsIndex = 0;
let getTracksIndex = 0;
let currentOffset = 2;

const savePlaylistData = (result) => {
    for (let i = 0, len = result.length; i < len; i++) {
        const key = result[i].body.href.split('/tracks')[0];

        myDataObject[key].tracks = result[i].body.items;
    }
};

const fetchData = () => {
    const goFetch = (users) => {
        return getPlaylists().then((data) => {
            data.body.items.forEach((rel) => {
                const key = rel.href;

                users.push(rel.id);
                myDataObject[key] = {
                    info: rel
                };
            })
            if (data.body.next == null) {
                return users;
            } else {
                return goFetch(users);
            }
        });
    }
    return goFetch([]);
};

const getPlaylists = function () {
    return new Promise((resolve, reject) => {
        const activeOffset = currentOffset;
        currentOffset += maxLimit;
        setTimeout(() => {
            console.log(`getPlaylists for ${user}`);
            spotifyApi.getUserPlaylists(user, { limit: maxLimit, offset: activeOffset }).then(resolve).catch(reject);
        }, getPlaylistsSleepTime * getPlaylistsIndex++);
    });;
};

const savePlaylistToFile = () => {
    const filePath = joinPath(__dirname, `${user}_playlistdata.json`);
    fs.writeFile(filePath, JSON.stringify(myDataObject), function (err) {
        if (err) {
            console.log(err);
        }
        console.log("The file was saved!");
    });
};

const getTracks = (playlist) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            console.log(`getPlaylistTracks for ${user} and playlist ${playlist}`);
            spotifyApi.getPlaylistTracks(user, playlist).then(resolve).catch(reject);
        }, getTracksSleepTime * getTracksIndex++);
    })
}

const start = () => {
    spotifyApi.clientCredentialsGrant()
        .then((data) => {
            spotifyApi.setAccessToken(data.body['access_token']);
        })
        .then((res) => {
            //Offset to skip non "sommarprat"
            //GetAmount of playlists
            return fetchData();
        })
        .then((result) => {
            return Promise.all(result.map(playlist => getTracks(playlist)));
        })
        .then((result) => {
            savePlaylistData(result);
            savePlaylistToFile();
        })
        .catch((error) => {
            console.log('Error getting Spotify data ' + error);
        });
}

start();