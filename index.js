var SpotifyWebApi = require('spotify-web-api-node');
var secrets = require('./secrets');

var spotifyApi = new SpotifyWebApi(secrets.spotify);

var user = 'p1_sverigesradio';
var myDataObject = {};
var allPlaylistIds = null;
var maxLimit = 50;

spotifyApi.clientCredentialsGrant()
    .then(function (data) {
        spotifyApi.setAccessToken(data.body['access_token']);
    })
    .then(function (res) {
        //Offset to skip non "sommarprat"
        //GetAmount of playlists
        return fetchData();
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

var fetchData = function () {
    var goFetch = function (users) {
        return getPlaylists().then(function (data) {
            data.body.items.forEach(function (rel) {
                 users.push(rel.id);
                var key = rel.href;
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
var currentOffset = 2;
var getPlaylists = function () {
    var activeOffset = currentOffset;
    currentOffset += maxLimit;

    return Promise.resolve(spotifyApi.getUserPlaylists(user, { limit: maxLimit, offset: activeOffset }));
};

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