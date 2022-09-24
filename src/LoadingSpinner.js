import FillerIcons from "./FillerIcons";

function LoadingSpinner({ albums }) {

	return (
		<>
			{ albums.length === 0 ?
			<>
				<div id="loading">
					<h1><i className="fa-solid fa-compact-disc"></i></h1>
				</div>
				<FillerIcons icon='record-vinyl'/>
			</>
			: "" }
		</>
	);
}

export default LoadingSpinner;