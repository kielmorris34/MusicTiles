import { useEffect, useState, useLayoutEffect } from 'react';
import './App.css';
import ArtGrid from './ArtGrid';
import Settings from './Settings';
import TopBar from './TopBar';
import LoginPrompt from './LoginPrompt'
import axios from 'axios';

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

	const REDIRECT_URI = "http://localhost:3000";
	const CLIENT_ID = "1667bd23e69245408998d6429c6b6949";
	const CLIENT_SECRET = "e44899b0f5114a64bd5bcecdb6036cf3";
	const API = "https://api.spotify.com/v1/";
	const AUTH_ENDPOINT = "https://accounts.spotify.com/authorize?" +
		"response_type=code" +
		`&client_id=${CLIENT_ID}` +
		"&scope=user-library-read" +
		`&redirect_uri=${REDIRECT_URI}`;

	useEffect(() => {
		if (albums.length === 0) {
			let storedToken = window.localStorage.getItem("token");
			if (storedToken) {
				let storedRefreshToken = window.localStorage.getItem("refresh_token");
				setTokens({token: storedToken, refreshToken: storedRefreshToken, tokenType: "personal" });
			} else if (window.location.search.length > 0) { // set upon redirect back from Spotify login
					let code = (new URLSearchParams(window.location.search)).get('code');
					callAuthApi("personal", "grant_type=authorization_code"
						+ `&code=${code}`
						+ `&redirect_uri=${encodeURI(REDIRECT_URI)}`
						+ `&client_id=${CLIENT_ID}`
						+ `&client_secret=${CLIENT_SECRET}`
					);
					window.history.pushState("", "", REDIRECT_URI); // remove param from url
			} else {
				callAuthApi("general", "grant_type=client_credentials"
					+ `&redirect_uri=${encodeURI(REDIRECT_URI)}`
					+ `&client_id=${CLIENT_ID}`
					+ `&client_secret=${CLIENT_SECRET}`
				);
			}
		}
	}, [albums]);

	useEffect(() => {
		if (tokens.token && albums.length === 0) {
			if (tokens.tokenType === "personal") {
				getSpotifyPersonalAlbums();
			} else { // general
				getSpotifyGeneralAlbums();
			}
		}
	}, [tokens]);

	useEffect(() => {
		if (albums.length < count) {
			setAlbums(ensureMinAlbumCount(albums));
		}
	}, [count]);

	useEffect(() => {
		setTileSize(height / rows);
		setCount(Math.floor(width / (height / rows)) * rows);
		console.log("effect: resize/rows");
	}, [rows, width, height]);

	const getSpotifyPersonalAlbums = async () => {
		let responses = [];
		const limit = 50;
		let offset = 0;
		let theresMore = true;
		do {
			const {data} = await axios.get(API + `me/albums?limit=${limit}&offset=${offset}`, {
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
			})
			responses.push(data);

			offset += limit;
			theresMore = offset < data.total;
		} while (theresMore);

		// Parse response to general format
		let newAlbums = [];
		responses.forEach(data =>
			newAlbums = newAlbums.concat(data.items.map(item => ({
				name: item.album.name,
				artist: item.album.artists[0].name,
				art_url: item.album.images[0].url,
				release_date: item.album.release_date,
				id: item.album.id
			})))
		);
		setAlbums(ensureMinAlbumCount(newAlbums));
	}

	const getSpotifyGeneralAlbums = async () => {
		let responses = [];
		const limit = 50;
		let offset = 0;
		let theresMore = true;
		let {data} = await axios.get(API + `browse/featured-playlists`, {
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
		//console.log(playlistData);
		let albums = [];
		let playlists = data.playlists.items;
		for (const playlist of playlists) {
			console.log(playlist);
			data = await axios.get(playlist.tracks.href, {
				headers: {
					Authorization: `Bearer ${tokens.token}`
				},
			});
			console.log(data);
			// Parse response to general album format
			albums = albums.concat(data.data.items.map(item => ({
				name: item.track.album.name,
				artist: item.track.album.artists[0].name,
				art_url: item.track.album.images[0].url,
				release_date: item.track.album.release_date,
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

	function callAuthApi(authType, body) {
		let xhr = new XMLHttpRequest();
		xhr.open("POST", "http://accounts.spotify.com/api/token");
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
			console.log(data);
			if (authType === "personal") {
				if (data.access_token !== undefined) {
					window.localStorage.setItem("token", data.access_token);
				}
				if (data.refresh_token !== undefined) {
					window.localStorage.setItem("refresh_token", data.refresh_token);
				}
			}
			setTokens({token: data.access_token, refreshToken: data.refresh_token, tokenType: authType });
		} else if (this.status === 401) {
			console.log("refresh 401");
			callAuthApi("grant_type=refresh_token"
				+ `&refresh_token=${tokens.refreshToken}`
				+ `&client_id=${CLIENT_ID}`
			);
		} else {
			console.log("bad response");
			console.log(response.responseText);
			alert(response.responseText);
		}
	}

	return (
		<div id="App">
			<TopBar tokens={tokens} setTokens={setTokens} clientId={CLIENT_ID} 
				rows={rows} setRows={setRows} flipTime={flipTime} 
				setFlipTime={setFlipTime} setAlbums={setAlbums} />
			<ArtGrid albums={albums} tileSize={tileSize} count={count} flipTime={flipTime} />
			{tokens.tokenType !== "personal" ?
				<LoginPrompt authEndpoint={AUTH_ENDPOINT} tokens={tokens} />
			: "" }
		</div>
	);
}

export default App;
