import { useEffect, useRef, useState } from 'react';
import './App.css';
import ArtGrid from './ArtGrid';
import TopBar from './TopBar';
import LoginPrompt from './LoginPrompt'
import axios from 'axios';
import Details from './Details';
import LoadingSpinner from './LoadingSpinner';
import ResizeIndicator from './ResizeIndicator';
import { v4 as uuid } from 'uuid'

function useWindowDimension() {
	const [dimension, setDimension] = useState([
		window.innerWidth,
		window.innerHeight,
	]);
	useEffect(() => {
		const debouncedResizeHandler = debounce(() => {
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
		document.getElementById("ArtGrid")?.style.setProperty('opacity', 0);
		document.getElementById("resizing")?.style.setProperty('opacity', 1);
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
	const [defaultAlbums, setDefaultAlbums] = useState([]);
	const [flipTime, setFlipTime] = useState(4);
	const [details, setDetails] = useState();
	const [contentMode, setContentMode] = useState("ALBUMS");
	const [playlists, setPlaylists] = useState({});
	const [selectedPlaylist, setSelectedPlaylist] = useState();
	const [imageCache, setImageCache] = useState([]);
	//const [updateCode, setUpdateCode] = useState('');
	const updateCode = useRef(null);

	const REDIRECT_URI = window.location.href.split('?')[0];
	const CLIENT_ID = process.env.REACT_APP_CLIENT_ID;
	const API = "https://api.spotify.com/v1/";

	// EFFECTS ///////////////////////////////////////////////////////////

	// STARTUP
	useEffect(() => {
		if (tokens.getting || tokens.token) return;

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
		// console.log("running auth effect -- no albums, proceeding");
		getAuth();
		if (defaultAlbums.length === 0) getSpotifyGeneralAlbums();
	}, [tokens]);

	// useEffect(() => {
	// 	if (albums.length > 0) cacheImages(albums.map(album => album.art_url)); // cache album art
	// }, [albums]);

	// GET CONTENT UPON TOKEN OR MODE CHANGE
	useEffect(() => {
		if (albums.length === 0) {
			if (tokens.token) {
				getSpotifyPersonalContent();
				if (Object.keys(playlists).length === 0 && tokens.tokenType === "personal") {
					getSpotifyPersonalPlaylists();
				}
			} else if (defaultAlbums?.length > 0) { // general, done in this effect for after logout (tokens wiped)
				let currentCode = uuid();
				updateCode.current = currentCode;
				safeSetAlbums(defaultAlbums, currentCode);
			}
		}	
	}, [tokens, contentMode, selectedPlaylist, defaultAlbums]);

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
		document.getElementById("ArtGrid")?.style.setProperty('opacity', 1);
		document.getElementById("resizing")?.style.setProperty('opacity', 0);
	}, [rows, width, height]);

	// FUNCTIONS ///////////////////////////////////////////////////////////

	function getAuth() {
		if (tokens.getting) return;

		setTokens({ getting: true });

		let storedToken = window.localStorage.getItem("token");
		// GET STORED LOGIN - if exists
		if (storedToken) {
			// console.log("stored personal token found")
			let storedRefreshToken = window.localStorage.getItem("refresh_token");
			setTokens({ token: storedToken, refreshToken: storedRefreshToken, tokenType: "personal" });

		// GET ACCOUNT AUTH WITH CODE - code set upon redirect back from Spotify login
		} else if (window.location.search.length > 0) {
			// console.log("code seen, getting account token")
			let code = (new URLSearchParams(window.location.search)).get('code');
			callAuthApi("personal", "grant_type=authorization_code"
				+ `&code=${code}`
				+ `&redirect_uri=${encodeURI(REDIRECT_URI)}`
				+ `&client_id=${CLIENT_ID}`
				+ `&code_verifier=${localStorage.getItem("code_verifier")}`
			);
			window.history.pushState("", "", REDIRECT_URI); // remove param from url
		}
	}

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
					id: item.album.id,
				})))
			);
		} else { // SONGS, PLAYLIST
			responses.forEach(data => {
				newAlbums = newAlbums.concat(data.items.map(item => ({
					track: item.track.name,
					track_number: item.track.track_number,
					name: item.track.album.name,
					artist: item.track.album.artists[0].name,
					art_url: item.track.album.images[0].url,
					release_date: item.track.album.release_date,
					spotify_link: item.track.album.external_urls.spotify,
					id: item.track.album.id,
				})))
			});
		}
		return newAlbums;
	}

	const getSpotifyPersonalContent = async () => {
		let currentCode = uuid();
		updateCode.current = currentCode;

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
					// console.log("refresh 401 personal albums");
					callAuthApi("personal", "grant_type=refresh_token"
						+ `&refresh_token=${tokens.refreshToken}`
						+ `&client_id=${CLIENT_ID}`
					);
				} else if (error.response && error.response.status === 429) {
					setTimeout(() => {
						getSpotifyPersonalContent();
					}, (error.response.headers.retryAfter ?? 2)*1000 + 100);
				} else if (error.response) {
					// console.log('uncaught error while getting personal content: ' + error.response.status);
					// console.log(error.response)
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
		safeSetAlbums(backloadDupeAlbums(ensureMinAlbumCount(newAlbums)), currentCode);
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
					// console.log("refresh 401 personal playlists");
					callAuthApi("personal", "grant_type=refresh_token"
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
		// console.log('getting generals');
		const res = await fetch('https://km-mid.netlify.app/api/getgeneralspotifyalbums', {
			method: 'GET',
			mode: 'cors',
			header: { 
				'Content-Type': 'application/json',
			},
		})
		let json = await res.json();
		let newAlbums = json.data;

		// don't overwrite if already there
		// console.log("GOT GEN ALBUMS");
		if (defaultAlbums.length > 0) return;

		setDefaultAlbums(ensureMinAlbumCount(newAlbums));
	}

	function ensureMinAlbumCount(albumArr) {
		if (albumArr.length > 0) {
			// add dupes if less albums are saved than the
			// desired amount to be shown
			while (albumArr.length < count) {
				albumArr = albumArr.concat(albumArr);
			}
		} else {
			// console.log("No albums");
			return [];
		}
		albumArr = [...albumArr].sort(() => 0.5 - Math.random()); // shuffle
		return albumArr;
	}

	function backloadDupeAlbums(albumArr) {
		let seen = new Set();
		let backloaded = [];
		albumArr.forEach(album => {
			if (seen.has(album.art_url)) {
				backloaded.push(album);
			} else {
				backloaded.splice(0, 0, album);
				seen.add(album.art_url);
			}
		})
		return backloaded;
	}

	function getShuffledAlbumsCopy() {
		const shuffled = [...albums].sort(() => 0.5 - Math.random());
		return backloadDupeAlbums(shuffled);
	}

	function safeSetAlbums(newAlbums, code) {
		if (code !== updateCode.current) {
			// console.log(`album change denied, code ${code} != ${updateCode.current}. Attempted change below`);
			// console.trace(newAlbums);
			return;
		}
		setAlbums(newAlbums);
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
			// console.log("success 200");
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
			// console.log("refresh 401, refreshToken: " + tokens.refreshToken);
			callAuthApi(authType, "grant_type=refresh_token"
				+ `&refresh_token=${tokens.refreshToken}`
				+ `&client_id=${CLIENT_ID}`
			);
		} else {
			// console.log("bad response on authType: " + authType);
			// console.log(response.responseText);
			//alert(response.responseText);
		}
	}

	function flipTile(tileIndex, album) {
		const artGrid = document.getElementById("ArtGrid");
		// choose tile to flip
		const tileImg = artGrid.children.item(tileIndex).firstChild;

		tileImg.setAttribute("spotifylink", album.spotify_link); // these are in the album json,
		tileImg.setAttribute("arturl", album.art_url);           // but still want easy/fast access
		tileImg.setAttribute("album", JSON.stringify(album));

		tileImg.classList.remove("flip-anim-end");
		void tileImg.offsetWidth;
		tileImg.classList.add("flip-anim-start");
		tileImg.addEventListener("animationend", flipAnimCallback, false);

		artGrid.setAttribute("lastFlipped", tileIndex);
	}

	function flipAnimCallback(e) {
		const tileImg = e.target;

		// set new image
		tileImg.style.setProperty("display", "none");
		tileImg.setAttribute("src", tileImg.getAttribute("arturl"));

		// trigger 2nd animation
		tileImg.classList.remove("flip-anim-start");
		tileImg.style.setProperty("animation-delay", '0s');
		void tileImg.offsetWidth;
		tileImg.classList.add("flip-anim-end");
		tileImg.style.setProperty("display", "block");

		e.target.removeEventListener("animationend", flipAnimCallback);
	}

	function cascade() {
		if (flipTime >= 98) return; // don't cascade if one is still happening

		const colDelay = .1;
		const rowDelay = .1;
		let delay = 0;
		const tilesPerRow = Math.floor(width / tileSize);
		const tiles = Array.from(document.getElementById("ArtGrid").children);
		const shuffledAlbums = getShuffledAlbumsCopy();
		tiles.forEach((tile, index) => {
			const tileImg = tile.firstChild;
			delay = (colDelay * (index % tilesPerRow)) + (rowDelay * Math.floor(index / tilesPerRow));
			tileImg.style.setProperty("animation-delay", `${delay}s`);
			flipTile(index, shuffledAlbums[index]);
		})

		const prevFlipTime = flipTime;
		if (flipTime < 98) {
			setFlipTime(99);
			document.getElementById('flip-rate-slider').setAttribute('disabled', 'true')
		}
		// reset delays
		setTimeout(() => {
			setFlipTime(prevFlipTime);
			document.getElementById('flip-rate-slider').removeAttribute('disabled')
		}, (delay*1000 + 1000)); // in ms!
	}

	function goFullscreen() {
		if (document.fullscreenElement !== null) {
			document.exitFullscreen();
		} else {
			document.getElementById('App').requestFullscreen();
		}
	}

	async function cacheImages(srcs) {
		const images = [];
		const promises = await srcs.map(src => {
			return new Promise((resolve, reject) => {
				const img = new Image();
				images.push(img);

				img.src = src;
				img.onload = resolve();
				img.onerror = reject();
			});
		});
		await Promise.all(promises);
		setImageCache(images);
		// console.trace("all album art loaded")
	}

	return (
		<div id="App">
			<TopBar tokens={tokens} setTokens={setTokens}
				rows={rows} setRows={setRows} flipTime={flipTime}
				setFlipTime={setFlipTime} setAlbums={setAlbums}
				contentMode={contentMode} setContentMode={setContentMode}
				playlists={playlists} selectedPlaylist={selectedPlaylist} setPlaylists={setPlaylists}
				setSelectedPlaylist={setSelectedPlaylist} cascade={cascade} goFullscreen={goFullscreen} redirectToSpotifyAuthorizeEndpoint={redirectToSpotifyAuthorizeEndpoint} />
			<ArtGrid albums={albums} tileSize={tileSize} count={count} flipTime={flipTime}
			 setDetails={setDetails} details={details} flipTile={flipTile} />
			<LoginPrompt redirectToSpotifyAuthorizeEndpoint={redirectToSpotifyAuthorizeEndpoint} tokens={tokens} />
			<LoadingSpinner albums={albums} />
			<ResizeIndicator albums={albums} />
			<Details details={details} setDetails={setDetails} />
		</div>
	);
}

export default App;
