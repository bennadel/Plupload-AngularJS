<cfscript>
	
	// Require the form fields.
	param name="form.id" type="numeric";

	image = application.images.getImage( form.id );

	// Delete the image "record".
	application.images.deleteImage( image.id );

	// Delete the image binary.
	fileDelete( expandPath( "/uploads/#images.serverFile#" ) );

	// Prepare API response.
	response.data = true;

</cfscript>