# Overview of the app

* When the user opens 'http://localhost:8080', the welcome page shows up. There is a button to prompt user to sign in its Spotify account.

* After signed in, the app will make a request for all playlists under user's account and display them in the next page. The user needs to select the playlist it wants to convert. Then click the submit button.

* Then the app will make a request for all tracks and artists under user's seleced playlist. After this, the app will make another request to get youtube videoId for all tracks.

* Next the app will prompt user to authenticate in order to use Youtube insert api. After user authenticated, the app will create a playlist under user's Youtube account, then adds all videos found in the above step into the newly created account.

* Finally, the app directs user to a page where the newly created playlist is embeded. User can either play the playlist, or click the restart button to do another conversion.
