import FillerIcons from "./FillerIcons";

function ResizeIndicator({ albums }) {

	return (
		<div>
			<div id="resizing">
				<h1>
					<i className="fa-solid fa-maximize"></i>
				</h1>
				<p>RESIZING</p>
				<FillerIcons icon='maximize'/>
			</div>
		</div>
	);
}

export default ResizeIndicator;