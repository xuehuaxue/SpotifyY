# SpotifyY
Convert user's spotify playlist into a Youtube playlist. This app saves time for user who wants to watch music videos for songs under his Spotify playlist. Just in one click, the app will handle the conversion and save the result as a playlist to user's Youtube account.

### The app is currently deployed with [heroku](https://spotifyy.herokuapp.com/), lets try it

## Getting Started
To use this app, you will need to have a Spotify account and a Google account. If you have them already, you have to create an application in your [Google Console](https://console.developers.google.com/) and an application in your [Spotify Developer Dashboard](https://beta.developer.spotify.com/). When creating both apps, don't forget to select **Web app** option. You also have to enable **YouTube Data API v3** for your google app.

**IMPORTANT** You must add ```"http://localhost:8080/auth/spotify/callback"``` as **Redirect URIs** for your Spotify app, and add ```"http://localhost:8080/auth/youtube/callback"``` as **Redirect URIs** for your Google app. 
When you are done with above steps, you will obtain required credentials, use them to modify **```auth/auth.js```** file in the following way.

```js
var credential = {
    spotify: {
        client_id: "replace with your Spotify client id"
        client_secret: "replace with your Spotify client secret"
    },
    
    youtube: {
        key: "replace with your google developer key"
    }
}

let oauth = Youtube.authenticate({
    type: "oauth",
    client_id: "replace with your google client id"
    client_secret: "replace with your google client_secret",
    redirect_url: "don't change" 
})
```

## Dependencies
### Backend
* [Node.js](https://nodejs.org/en/)
* [Express](https://expressjs.com/)

### Frontend
* [Ejs](http://www.embeddedjs.com/)

### Api
* [Spotify](https://developer.spotify.com/web-api/)
* [Youtube](https://developers.google.com/youtube/)
* [Google APIs Node.js Client](https://www.npmjs.com/package/googleapis)
* [Passport npm](https://www.npmjs.com/package/passport)

## Run the app
### Install dependencies
```cd``` into app directory and run
```
npm install
```

### Initiate App
After dependencies are correctly installed, run
```
node app.js
```
Now open the browser and go to *"http://localhost:8080"*

*Start to convert your Spotify playlist!*
