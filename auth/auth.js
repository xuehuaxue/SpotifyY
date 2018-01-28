var Youtube = require("youtube-api")

var credential = {
    spotify: {
        client_id: 'replace with your Spotify client id',  //this is your spotify client_id
        client_secret: 'replace with your Spotify client secret' //this is your spotify client_secret
    },

    youtube: {
        key: 'replace with your google developer key',  //this is your google devloper key
    }
}

let oauth = Youtube.authenticate({
    type: "oauth",
    client_id: 'replace with your google client id',
    client_secret: 'replace with your google client_secret',
    redirect_url: "http://localhost:8080/auth/youtube/callback"
})

exports.credential = credential
exports.oauth = oauth
