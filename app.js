var express = require('express')
var session = require('express-session')
var bodyParser = require('body-parser')
var request = require("request")
var Youtube = require("youtube-api")
var auth = require('./auth/auth')
var oauth = auth.oauth  // uses for authentication in combine with nmp package - youtube-api
var passport = require('passport')
var SpotifyStrategy = require('passport-spotify').Strategy

var app = express()

app.use(bodyParser())
app.use(session({
    resave: true,
    saveUninitialized: true,
    secret: "secret",
    cookie: {secure: false},
}))

// for this app, I am using passport spotify package for spotify authenication
// https://www.npmjs.com/package/passport-spotify

// Passport session setup.
passport.serializeUser(function (user, done) {
    done(null, user);
});

passport.deserializeUser(function (obj, done) {
    console.log(obj)
    done(null, obj);
});

app.use(passport.initialize())
app.use(passport.session())

// set the view engine to ejs
app.set('view engine', 'ejs')

// this is the welcome page, it provdes button to redirects users to the spotify authentication page
app.get('/', function (req, res) {
    req.session.destroy()
    res.render('welcome')
})

// use passport-spotify to do authentication and stores the result in passport.session
// new spotify strategy
passport.use(new SpotifyStrategy({
        clientID: auth.credential.spotify.client_id, //get oauth client id from auth.js file
        clientSecret: auth.credential.spotify.client_secret,  // get oauth secret from auth.js file
        callbackURL: "http://localhost:8080/auth/spotify/callback"
    },
    function (accessToken, refreshToken, profile, done) {
        if (profile) {
            console.log("the app is trying to get user's profile")
            var User = profile
            User.AccessToken = accessToken
            return done(null, User)
        }
        else {
            return done(null, false)
        }
    }
    )
)

// use the passport strategy defined above
app.get('/auth/spotify', passport.authenticate('spotify'))

// after authenticated, redirects to here
app.get('/auth/spotify/callback',
    passport.authenticate('spotify', {failureRedirect: '/'}),
    function (req, res) {
        // Successful authentication, redirect to next step.

        // lets save the info into session
        req.session.save(function (err) {
            // session saved
        })

        res.redirect('/select_playlist')
    })

// after authenitication process is done, collect all playlists under the account, up to 20
app.get('/select_playlist', function (req, res) {
    var all_playlist = []  // an array used to store all playlist under user's Spotify account
    var username = req.session.passport.user.username  // retrive information store in session
    var accessToken = req.session.passport.user.AccessToken
    console.log("got " + username + "'s playlist")
    // api call to get playlists under current user's account

    request.get(
        'https://api.spotify.com/v1/me/playlists',
        {
            headers: {Authorization: 'Bearer ' + accessToken},
            qs: {limit: 20}
        },
        function (error, response, body) {
            if (!error) {
                let JSONBody = JSON.parse(body)
                console.log(JSONBody.items)

                // store all playlist into all_playlst
                JSONBody.items.forEach(function (playlist_name) {
                    all_playlist.push(
                        {
                            name: playlist_name.name.replace(/ /g, "_"), // if playlist's name contains space, replace with _
                            tracks: playlist_name.tracks
                        }
                    )
                })
                req.session.all_playlist = all_playlist
                // display all playlist in ejs, so user can select which they want to get
                res.render('playlist', {playlist: all_playlist, username: username})
            }
        }
    )
})

app.post('/get_tracks', function (req, res) {
    console.log(req.session)
    var select_playlist = req.body.list  //the playlist choose by user from front-end

    // user input title and description
    var title = req.body.title
    var description = req.body.description
    console.log("the selected playlist is " + select_playlist)

    // get the playlist (its data) from found_playlist array that matches user's selected playlist
    var found_playlist = req.session.all_playlist.filter(function (item) {
        return item.name == select_playlist;
    })

    // since I store Json data for every playlist, the app gets the 'selected' one, and gets its uri for api call
    var uri_for_this_album = found_playlist[0].tracks.href
    console.log(uri_for_this_album)

    var songs_collection = []  //array use to store all songs from SELECTED playlist

    // request the Spotify api of what we just selected, this will return data for every tracks within the playlist
    request.get(
        uri_for_this_album,
        {
            headers: {
                Authorization: 'Bearer ' + req.session.passport.user.AccessToken,
            },
        },
        function (error, response, body) {
            if (!error) {
                let JSONBody = JSON.parse(body)

                // stores song name and its artist to songs_collection for every song
                JSONBody.items.forEach(function (song) {
                    songs_collection.push(
                        {
                            name: song.track.name,
                            artist: song.track.artists[0].name
                        }
                    )
                })

                // if user doesn't input title and description, use automatic one
                if (title) {
                    select_playlist = title
                }
                if (!description) {
                    description = 'Created by SpotifyY'
                }

                // we have gotten all songs' name and artist, its the time to get to the next step
                console.log(songs_collection)
                console.log(select_playlist)
                console.log(description)

                // store information to req.session
                req.session.songs_collection = songs_collection
                req.session.select = select_playlist
                req.session.description = description
                console.log("fetched all tracks under the album, lets converting them to youtube")
                res.redirect("/youtube_search")
            }
        }
    )
})


app.get('/youtube_search', function (req, res) {
    // I was planned to use a counter to make sure it redirects only when all videos have been found
    // seems like doesn't work the way as I want. However, it doesn't cause any error
    var songs_collection = req.session.songs_collection
    var select = req.session.select
    var counter = 0

    // a request calling for youtube search api
    // requests for N times where N = number of songs we have in total

    var youtube_link = [] // session used to store video_id for every songs in song_collections
    req.session.youtube_link = youtube_link

    let find_video_id = function () {

        songs_collection.forEach(function (song) {
            console.log(song.name + ' ' + song.artist)
            request.get(
                'https://www.googleapis.com/youtube/v3/search',
                {
                    qs: {
                        key: auth.credential.youtube.key,   // developer key is stored in auth.js
                        q: song.name + ' ' + song.artist,
                        part: 'snippet',
                        type: 'video',
                        maxResults: 1
                    }
                }, function (error, response, body) {
                    if (!error) {
                        ++counter
                        let JSONBody = JSON.parse(body)
                        if (JSONBody.items.length != 0) {  // if for some reason, videoID is not found, skip it
                            console.log("adding " + counter + "th element: " + JSONBody.items[0].id.videoId)
                            req.session.youtube_link[counter] = (JSONBody.items[0].id.videoId)
                            if (counter == songs_collection.length) {
                                console.log("lets redirect to next step")
                                res.redirect("/auth/youtube")
                            }
                        }
                    }
                }
            )
        })
    }

    // call the method
    find_video_id()
})


// youtube-api uses google apis npm, I authenticate youtube using youtube-api first
// then directly use google apis npm to do playlist.insert, playlistitems.insert, etc

// authenticate google account
app.get('/auth/youtube', function (req, res) {
    res.redirect(oauth.generateAuthUrl({
        access_type: "offline",
        scope: ["https://www.googleapis.com/auth/youtube"]
    }))
})

// sign in successful, its the time to create the playlist
app.get('/auth/youtube/callback', function (req, res) {
    console.log("welcome to create playlist page! You are almost there!")

    var code = req.query.code //this is used to get access token

    console.log("Trying to get the token using the following code: " + code)

    oauth.getToken(code, function (err, tokens) { // get the Token

        if (err) {
            console.error(err)
            res.status(500).send(err)
            return console.error(err)
        }

        console.log(tokens)
        oauth.setCredentials(tokens)
        console.log("Got the tokens.")
        res.redirect("/create_playlist")  //after got the token, redirect to next step
    })
})

// now we got all necessary info, lets create the playlist!

app.get('/create_playlist', function (req, res) {
    // a request to create playlist with the name of selected spotify playlist
    // as well as auth we just acquired in the above step
    let reqe = Youtube.playlists.insert({
        part: 'snippet,status',
        resource: {
            snippet: {
                title: "Created by SpotifyY - " + req.session.select,
                description: req.session.description
            },
            status: {
                privacyStatus: 'public'
            }
        }
    }, function (err, data) {
        if (data) {  // if there is data, then we konw it is successful, otherwise we gets error
            var playlist_id = data.id
            console.log(data)
            add_songs(playlist_id, 0)
            console.log('Create successfully!')
        }
        if (err) {
            console.log("I got an error")
            console.error(err)
        }
    })

    var video_id // use to store video_id for every videos
    // calling youtube.playlistitems.insert for every videoID in youtube_link will add every music video to
    // the playlist. However, due to asynchronous nature of javascript, using forEach method or {for i=0, i<N, i++} will
    // not add N songs to the playlist, therefore I use recursion and an index, this will perform request
    // one at a time.
    var youtube_link = req.session.youtube_link  //fetch youtube link from session
    youtube_link = youtube_link.filter(function (item) { // in case there is invalid item, remove it
        return item != null
    })

    let add_songs = function (playlist_id, index) {
        // fill up the playlist with lovely songs

        video_id = youtube_link[index]
        if (youtube_link.length != index) {
            // if index != number of songs we have, then keep perform request, otherwise stop and we are done
            console.log('the index is ' + index)
            let reqe = Youtube.playlistItems.insert({
                part: "snippet",
                resource: {
                    snippet: {
                        playlistId: playlist_id,
                        resourceId: {
                            kind: "youtube#video",
                            videoId: video_id
                        }
                    }
                }
            }, function (err, data) {
                if (data) {
                    console.log('Add ' + video_id + ' successfully!')
                    add_songs(playlist_id, ++index)
                }
                if (err) {
                    console.log("I got error")
                    console.error(err)
                }
            })
        }
        else {
            res.render('success', {link: "https://www.youtube.com/embed/?listType=playlist&list=" + playlist_id})
            console.log("https://www.youtube.com/embed/?listType=playlist&list=" + playlist_id)  //click this link
        }
    }
})


app.listen(8080);
console.log('its running')
console.log('click me http://localhost:8080')
