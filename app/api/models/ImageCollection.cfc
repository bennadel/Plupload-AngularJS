component
	output = false
	hint = "I model the collection of images."
	{

	/**
	* I initialize the collection.
	* 
	* @output false
	*/
	public any function init() {

		// I hold the images, in ascending sort order.
		images = [];

		return( this );

	}


	// ---
	// PULIC METHODS.
	// ---


	/**
	* I add the given image to the collection. I return the ID of the image.
	* 
	* @clientFile I am the filename as it appears on the original computer.
	* @serverFile I am the unique filename as it was saved on the server.
	* @sort I am the desires insertion point of the image in the current collection.
	* @output false
	*/
	public numeric function addImage( 
		required string clientFile,
		required string serverFile,
		required numeric sort
		) {

		// To keep this demo a super-simple as possible, we're going to use the current 
		// tick-count to make sure the images have unique IDs.
		var id = getTickCount();

		// If a valid sort value was not passed-in, just get the next available sort.
		if ( sort == -1 ) {

			sort = getNextSort();

		}

		var image = {
			id = id,
			clientFile = clientFile,
			serverFile = serverFile,
			sort = sort
		};

		// We are abount to insert the image in sort order; but, before we do that, we want
		// to bump each higher-sort image up so we can make room for the incoming image.
		incrementSortAbove( sort );

		// Now that we've bumped the sort, insert the image into the sort.
		insertImageInSortOrder( image );

		return( id );

	}


	/**
	* I delete the image with the given ID. If the image could not be found, an error
	* is thrown.
	* 
	* @id I am the unique ID of the image to delete.
	* @output false
	*/
	public void function deleteImage( required numeric id ) {

		for ( var i = 1 ; i < arrayLen( images ) ; i++ ) {

			if ( images[ i ].id == id ) {

				arrayDeleteAt( images, i );

				// The image has been deleted - nothing more to do.
				return;

			}

		}

		// If we made it this far, the image could not be found.
		throw( type = "App.NotFound" );

	}


	/**
	* I get all of the image (in sort order).
	* 
	* @output false
	*/
	public array function getAllImages() {

		// Return a duplicate of the collection so as not to break encapsulation.
		return( duplicate( images ) );

	}


	/**
	* I get the image with the given ID. If the image cannot be found, an error is thrown.
	* 
	* @id I am the unique ID of the image.
	* @output false
	*/
	public struct function getImage( required numeric id ) {

		for ( var image in images ) {

			if ( image.id == id ) {

				// Return a copy of the image so as not to break encapsulation.
				return( duplicate( image ) );

			}

		}

		// If we made it this far, the image couldn't be found.
		throw( type = "App.NotFound" );

	}


	// ---
	// PRIVATE METHODS.
	// ---


	/**
	* I get the next highest sort in the collection.
	* 
	* @output false
	*/
	private numeric function getNextSort() {

		var maxSort = 0;

		for ( var image in images ) {

			maxSort = max( maxSort, image.sort );

		}

		return( maxSort + 1 );

	}


	/**
	* I increment all the sort values above the given sort value (by one). 
	* 
	* @sort I am the sort value at which to start the incrementing.
	* @output false
	*/
	private void function incrementSortAbove( required numeric sort ) {

		for ( var image in images ) {

			if ( image.sort >= sort ) {

				image.sort++;

			}

		}

	}


	/**
	* I insert the image into the images collection in the given, relative sort position
	* (based on the sort of the incoming image).
	* 
	* @image I am the image being inserted.
	* @output false 
	*/
	private void function insertImageInSortOrder( required struct image ) {

		for ( var i = 1 ; i <= arrayLen( images ) ; i++ ) {

			// Insert the image before the first image that we encouter that has a larger sort.
			if ( images[ i ].sort >= image.sort ) {

				arrayInsertAt( images, i, image );

				// Return out - nothing else to do.
				return;

			}

		}

		// If we made it this far, the image was not been inserted - just add to the end.
		arrayAppend( images, image );

	}

}