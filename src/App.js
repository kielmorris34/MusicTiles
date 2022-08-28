import { useEffect, useState, useLayoutEffect } from 'react';
import './App.css';
import ArtGrid from './ArtGrid';
import Settings from './Settings';
import TopBar from './TopBar';
import LoginPrompt from './LoginPrompt'
import axios from 'axios';
import Details from './Details';

function useWindowDimension() {
	const [dimension, setDimension] = useState([
		window.innerWidth,
		window.innerHeight,
	]);
	useEffect(() => {
		const debouncedResizeHandler = debounce(() => {
			console.log('***** debounced resize'); // See the cool difference in console
			setDimension([window.innerWidth, window.innerHeight]);
		}, 1000); // 100ms
		window.addEventListener('resize', debouncedResizeHandler);
		return () => window.removeEventListener('resize', debouncedResizeHandler);
	}, []); // Note this empty array. this effect should run only on mount and unmount
	return dimension;
}

function debounce(fn, ms) {
	let timer;
	return _ => {
		clearTimeout(timer);
		timer = setTimeout(_ => {
			timer = null;
			fn.apply(this, arguments);
		}, ms);
	};
}

function App() {
	const [rows, setRows] = useState(5);
	const [tileSize, setTileSize] = useState();
	const [count, setCount] = useState();
	const [width, height] = useWindowDimension();
	const [tokens, setTokens] = useState({});
	const [albums, setAlbums] = useState([]);
	const [flipTime, setFlipTime] = useState(4);
	const [details, setDetails] = useState();
	const [contentMode, setContentMode] = useState("ALBUMS");
	const [playlists, setPlaylists] = useState({});
	const [selectedPlaylist, setSelectedPlaylist] = useState();

	//const REDIRECT_URI = "http://localhost:3000";
	// const REDIRECT_URI = "https://km-music-tiles.netlify.app/";
	const REDIRECT_URI = window.location.href.split('?')[0];
	console.log(REDIRECT_URI);
	const CLIENT_ID = "1667bd23e69245408998d6429c6b6949";
	const CLIENT_SECRET = "e44899b0f5114a64bd5bcecdb6036cf3";
	const API = "https://api.spotify.com/v1/";

	// STARTUP
	useEffect(() => {
		// GET MODE FROM STORAGE
		const storedContentMode = window.localStorage.getItem("content_mode");
		if (!storedContentMode) {
			setContentMode("ALBUMS");
			document.querySelector("#radio-albums").checked = true;
		} else {
			setContentMode(storedContentMode);
			document.querySelector(`#radio-${storedContentMode.toLowerCase()}`).checked = true;
		}

		// AUTH
		if (albums.length === 0 && (tokens === undefined || tokens.tokenType !== 'personal')) {
			console.log("running auth effect -- no albums, proceeding");
			let storedToken = window.localStorage.getItem("token");
			// GET STORED LOGIN - if exists
			if (storedToken) {
				console.log("stored personal token found")
				let storedRefreshToken = window.localStorage.getItem("refresh_token");
				setTokens({ token: storedToken, refreshToken: storedRefreshToken, tokenType: "personal" });

			// GET ACCOUNT AUTH WITH CODE - code set upon redirect back from Spotify login
			} else if (window.location.search.length > 0) {
				console.log("code seen, getting account token")
				let code = (new URLSearchParams(window.location.search)).get('code');
				callAuthApi("personal", "grant_type=authorization_code"
					+ `&code=${code}`
					+ `&redirect_uri=${encodeURI(REDIRECT_URI)}`
					+ `&client_id=${CLIENT_ID}`
					+ `&code_verifier=${localStorage.getItem("code_verifier")}`
				);

			// GET GENERAL AUTH - to show generic albums
			} else if (tokens.tokenType !== "personal") {
				console.log("getting generic token")
				console.log("current token type: " + tokens.tokenType);
				callAuthApi("general", "grant_type=client_credentials"
					+ `&redirect_uri=${encodeURI(REDIRECT_URI)}`
					+ `&client_id=${CLIENT_ID}`
					+ `&client_secret=${CLIENT_SECRET}`
				);
			}
			window.history.pushState("", "", REDIRECT_URI); // remove param from url
		} else {
			console.log("running auth effect -- albums present, stopping")
		}
	}, [albums]);

	// GET CONTENT UPON TOKEN OR MODE CHANGE
	useEffect(() => {
		if (tokens.token) {
			if (albums.length === 0) {
				if (tokens.tokenType === "personal") {
					getSpotifyPersonalContent();
				} else { // general
					getSpotifyGeneralAlbums();
				}
			}
			if (Object.keys(playlists).length === 0) {
				getSpotifyPersonalPlaylists();
			}
		}
	}, [tokens, contentMode, selectedPlaylist]);

	// ENSURE THERE ARE ENOUGH ALBUMS UPON WINDOW/ROW CHANGE
	useEffect(() => {
		if (albums.length > 0 && albums.length < count) {
			setAlbums(ensureMinAlbumCount(albums));
		}
	}, [count]);

	// WINDOW RE-SIZE
	useEffect(() => {
		const size = height / rows;
		setTileSize(size);
		setCount(Math.floor(width / size) * rows);
	}, [rows, width, height]);

	const mapSpotifyPersonalContent = (responses) => {
		let newAlbums = [];
		if (contentMode === "ALBUMS") {
			responses.forEach(data =>
				newAlbums = newAlbums.concat(data.items.map(item => ({
					name: item.album.name,
					artist: item.album.artists[0].name,
					art_url: item.album.images[0].url,
					release_date: item.album.release_date,
					spotify_link: item.album.external_urls.spotify,
					id: item.album.id
				})))
			);
		} else { // SONGS, PLAYLIST
			responses.forEach(data => {
				newAlbums = newAlbums.concat(data.items.map(item => ({
					track: item.track.name,
					name: item.track.album.name,
					artist: item.track.album.artists[0].name,
					art_url: item.track.album.images[0].url,
					release_date: item.track.album.release_date,
					spotify_link: item.track.album.external_urls.spotify,
					id: item.track.album.id
				})))
			});
		}
		return newAlbums;
	}

	const getSpotifyPersonalContent = async () => {
		let currContentMode = contentMode;
		let currSelectedPlaylist = selectedPlaylist;

		let responses = [];
		const limit = 50;
		let offset = 0;
		let theresMore = true;
		let endpoint = contentMode === "ALBUMS" ? "me/albums" : (contentMode === "SONGS" ? "me/tracks" : `playlists/${playlists[selectedPlaylist]}/tracks`);
		do {
			const { data } = await axios.get(API + `${endpoint}?limit=${limit}&offset=${offset}`, {
				headers: {
					Authorization: `Bearer ${tokens.token}`
				},
			}).catch(function (error) {
				if (error.response && error.response.status === 401) {
					console.log("refresh 401 personal albums");
					callAuthApi("grant_type=refresh_token"
						+ `&refresh_token=${tokens.refreshToken}`
						+ `&client_id=${CLIENT_ID}`
					);
				}
			})
			responses.push(data);

			offset += limit;
			theresMore = offset < data.total;
		} while (theresMore);

		// Check to see if grabbed data is still needed, cancel if not
		if (currContentMode !== contentMode || currSelectedPlaylist !== selectedPlaylist) return;

		// Parse response to general format
		let newAlbums = mapSpotifyPersonalContent(responses);
		setAlbums(ensureMinAlbumCount(newAlbums));
	}

	const getSpotifyPersonalPlaylists = async () => {
		let responses = [];
		const limit = 50;
		let offset = 0;
		let theresMore = true;
		do {
			const { data } = await axios.get(API + `me/playlists?limit=${limit}&offset=${offset}`, {
				headers: {
					Authorization: `Bearer ${tokens.token}`
				},
			}).catch(function (error) {
				if (error.response && error.response.status === 401) {
					console.log("refresh 401 personal playlists");
					callAuthApi("grant_type=refresh_token"
						+ `&refresh_token=${tokens.refreshToken}`
						+ `&client_id=${CLIENT_ID}`
					);
				}
			})
			responses.push(data);

			offset += limit;
			theresMore = offset < data.total;
		} while (theresMore);

		var newPlaylists = {};
		responses.forEach(data => {
			console.log(data);
			data.items.map(item => (
				newPlaylists[item.name] = item.id
			));
		});
		setPlaylists(newPlaylists);
		const playlistNames = Object.keys(newPlaylists);
		if (playlistNames.length > 0) {
			setSelectedPlaylist(playlistNames[0]);
		}
	}

	const getSpotifyGeneralAlbums = async () => {
		let responses = [];
		const limit = 50;
		let offset = 0;
		let theresMore = true;
		let { data } = await axios.get(API + `browse/featured-playlists`, {
			headers: {
				Authorization: `Bearer ${tokens.token}`
			},
		}).catch(function (error) {
			if (error.response && error.response.status === 401) {
				console.log("refresh 401");
				callAuthApi("grant_type=refresh_token"
					+ `&refresh_token=${tokens.refreshToken}`
					+ `&client_id=${CLIENT_ID}`
				);
			}
		});
		let albums = [];
		let playlists = data.playlists.items;
		for (const playlist of playlists) {
			data = await axios.get(playlist.tracks.href, {
				headers: {
					Authorization: `Bearer ${tokens.token}`
				},
			});
			// Parse response to general album format
			albums = albums.concat(data.data.items.map(item => ({
				name: item.track.album.name,
				artist: item.track.album.artists[0].name,
				art_url: item.track.album.images[0].url,
				release_date: item.track.album.release_date,
				spotify_link: item.track.album.external_urls.spotify,
				id: item.track.album.id
			})));
		}
		setAlbums(ensureMinAlbumCount(albums));
	}

	function ensureMinAlbumCount(albumArr) {
		if (albumArr.length > 0) {
			// add dupes if less albums are saved than the
			// desired amount to be shown
			while (albumArr.length < count) {
				albumArr = albumArr.concat(albumArr);
			}
		} else {
			console.log("No albums");
		}
		albumArr = [...albumArr].sort(() => 0.5 - Math.random()); // shuffle
		return albumArr;
	}

	function generateRandomString(length) {
		let text = '';
		const possible =
			'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

		for (let i = 0; i < length; i++) {
			text += possible.charAt(Math.floor(Math.random() * possible.length));
		}
		return text;
	}

	async function generateCodeChallenge(codeVerifier) {
		const digest = await crypto.subtle.digest(
			'SHA-256',
			new TextEncoder().encode(codeVerifier),
		);

		return btoa(String.fromCharCode(...new Uint8Array(digest)))
			.replace(/=/g, '')
			.replace(/\+/g, '-')
			.replace(/\//g, '_');
	}

	function redirectToSpotifyAuthorizeEndpoint() {
		const codeVerifier = generateRandomString(64);

		generateCodeChallenge(codeVerifier).then((code_challenge) => {
			window.localStorage.setItem('code_verifier', codeVerifier);

			window.location = generateUrlWithSearchParams("https://accounts.spotify.com/authorize?",
				{
					response_type: 'code',
					client_id: CLIENT_ID,
					scope: 'user-library-read',
					code_challenge_method: 'S256',
					code_challenge,
					redirect_uri: REDIRECT_URI
				}
			);
		});
	}

	function generateUrlWithSearchParams(url, params) {
		const urlObject = new URL(url);
		urlObject.search = new URLSearchParams(params).toString();
		return urlObject.toString();
	}

	function callAuthApi(authType, body) {
		let xhr = new XMLHttpRequest();
		xhr.open("POST", "https://accounts.spotify.com/api/token");
		xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
		xhr.setRequestHeader('Authorization', 'Basic ' + btoa(CLIENT_ID + ":" + CLIENT_SECRET));
		xhr.send(body);
		if (authType === "general") {
			xhr.onload = handleAuthResponseGeneral;
		} else { // personal
			xhr.onload = handleAuthResponsePersonal;
		}
	}

	function handleAuthResponseGeneral() { handleAuthResponse("general", this) }

	function handleAuthResponsePersonal() { handleAuthResponse("personal", this) }

	function handleAuthResponse(authType, response) {
		if (response.status === 200) {
			var data = JSON.parse(response.responseText);
			console.log("success 200");
			if (authType === "personal") {
				if (data.access_token !== undefined) {
					window.localStorage.setItem("token", data.access_token);
				}
				if (data.refresh_token !== undefined) {
					window.localStorage.setItem("refresh_token", data.refresh_token);
				}
			} // don't bother storing a "general" token
			setTokens({ token: data.access_token, refreshToken: data.refresh_token, tokenType: authType });
		} else if (response.status === 401) {
			console.log("refresh 401, refreshToken: " + tokens.refreshToken);
			callAuthApi("grant_type=refresh_token"
				+ `&refresh_token=${tokens.refreshToken}`
				+ `&client_id=${CLIENT_ID}`
			);
		} else {
			console.log("bad response on authType: " + authType);
			console.log(response.responseText);
			alert(response.responseText);
		}
	}

	return (
		<div id="App">
			<TopBar tokens={tokens} setTokens={setTokens} clientId={CLIENT_ID}
				rows={rows} setRows={setRows} flipTime={flipTime}
				setFlipTime={setFlipTime} setAlbums={setAlbums}
				contentMode={contentMode} setContentMode={setContentMode}
				playlists={playlists} selectedPlaylist={selectedPlaylist} setSelectedPlaylist={setSelectedPlaylist} />
			<ArtGrid albums={albums} tileSize={tileSize} count={count} flipTime={flipTime} setDetails={setDetails} details={details} />
			<LoginPrompt redirectToSpotifyAuthorizeEndpoint={redirectToSpotifyAuthorizeEndpoint} tokens={tokens} />
			<Details details={details} setDetails={setDetails} />
		</div>
	);
}

export default App;
