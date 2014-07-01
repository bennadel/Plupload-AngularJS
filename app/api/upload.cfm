<cfscript>
	
	// Require the form fields.
	param name="form.file" type="string";
	param name="form.sort" type="numeric" default="-1";

	// Save the actual binary.
	upload = fileUpload(
		expandPath( "/uploads/" ),
		"file",
		"",
		"makeUnique"
	);

	// Add to the collection - this will assign a unique ID to the image "record".
	imageID = application.images.addImage( 
		upload.clientFile, 
		upload.serverFile,
		form.sort
	);

	// Get the full image record.
	image = application.images.getImage( imageID );

	// Prepare API response.
	response.data = {
		"id" = image.id,
		"clientFile" = image.clientFile,
		"serverFile" = image.serverFile,
		"sort" = image.sort,
		"url" = "#application.baseImageUrl##urlEncodedFormat( image.serverFile )#"
	};

	sleep( 1000 );

</cfscript>