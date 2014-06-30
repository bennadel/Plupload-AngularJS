component
	output = false
	hint = "I define the application settings and event handler."
	{

	// Define the application settings.
	this.name = hash( getCurrentTemplatePath() );
	this.applicationTimeout = createTimeSpan( 0, 1, 0, 0 );
	this.sessionManagement = false;

	// Define the path mappings.
	this.mappings[ "/uploads" ] = ( getDirectoryFromPath( getCurrentTemplatePath() ) & "../uploads/" );


	/**
	* I initialize the application and set up the shared data structures. 
	* 
	* @output false
	*/
	public boolean function onApplicationStart() {

		// I hold the image that were uploaded to the application.
		application.images = new models.ImageCollection();

		// I hold the base image URL for the pulic uploads. Since we don't have a 
		// real application container, we're just going to hard-code this value with
		// a relative path that is known for the app.
		application.baseImageUrl = "./uploads/";

		// Return true so that the request can continue loading.
		return( true );

	}


	/**
	* I initialize the request.
	* 
	* @output false
	*/
	public boolean function onRequestStart( required string scriptName ) {

		// Check to see if the re-initialization flag has been passed.
		if ( structKeyExists( url, "init" ) ) {

			onApplicationStart();

		}

		// Return true so that the request can continue loading.
		return( true );

	}

}