var SpotifyWebApi = require('spotify-web-api-node');
var secrets = require('./secrets');

var spotifyApi = new SpotifyWebApi(secrets.spotify);

var user = 'p1_sverigesradio';
var myDataObject = {};

spotifyApi.clientCredentialsGrant()
    .then(function (data) {
        spotifyApi.setAccessToken(data.body['access_token']);
    })
    .then(function (res) {
        //Offset to skip non "sommarprat"
        return spotifyApi.getUserPlaylists(user, { limit: 50, offset: 2});
    })
    .then(function (data) {
        data.body.items.forEach(function (rel) {
            var key = rel.href;
            myDataObject[key] = {
                info: rel
            };
        })
        return data.body.items.map(item => item.id);
    })
    .then(function (result) {
        return Promise.all(result.map(playlist => getTracks(playlist)));
    })
    .then(function (result) {
        savePlaylistData(result);
        savePlaylistToFile();
    })
    .catch((error) => {
        console.log('Error getting Spotify data ' + error);
    });

function savePlaylistData(result) {
    for (var i = 0, len = result.length; i < len; i++) {
        var key = result[i].body.href.split('/tracks')[0];
        myDataObject[key].tracks = result[i].body.items;
    }
}

function savePlaylistToFile() {
    const fs = require('fs');
    const join = require('path').join;
    const filePath = join(__dirname, user + 'playlistdata.json');
    fs.writeFile(filePath, JSON.stringify(myDataObject), function (err) {
        if (err) {
            return console.log(err);
        }
        console.log("The file was saved!");
    });
}

function getTracks(playlist) {
    return spotifyApi.getPlaylistTracks(user, playlist);
}