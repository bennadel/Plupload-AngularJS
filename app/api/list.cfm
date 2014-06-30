<cfscript>

	// Set up the response structure.
	response.data = [];

	// Add each image to the response.
	// --
	// NOTE: These are coming back in sort-order, so we don't have to do anything else.
	for ( image in application.images.getAllImages() ) {

		arrayAppend(
			response.data,
			{
				"id" = image.id,
				"clientFile" = image.clientFile,
				"serverFile" = image.serverFile,
				"sort" = image.sort,
				"url" = "#application.baseImageUrl##urlEncodedFormat( image.serverFile )#"
			}
		);

	}

</cfscript>