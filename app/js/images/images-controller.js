
app.controller(
	"ImagesController",	
	function( $scope, imagesService ) {

		// I hold the uploaded images.
		$scope.images = [];

		$scope.$on( "imageUploaded", handleImageUploaded );

		// Load the remote data from the server.
		loadRemoteData();


		// ---
		// PUBLIC METHODS.
		// ---



		// ---
		// PRIVATE METHODS.
		// ---


		function applyRemoteData( images ) {

			$scope.images = images;

		}


		function handleImageUploaded( event, image ) {

			incrementSortAbove( image.sort );

			insertImageInSortOrder( image );

		}


		function incrementSortAbove( sort ) {

			for ( var i = 0, length = $scope.images.length ; i < length ; i++ ) {

				var image = $scope.images[ i ];

				if ( image.sort >= sort ) {

					image.sort++;

				}

			}

		}


		function insertImageInSortOrder( image ) {

			for ( var i = 0, length = $scope.images.length ; i < length ; i++ ) {

				// Insert the image before the first image that we encouter that has a larger sort.
				if ( $scope.images[ i ].sort >= image.sort ) {

					$scope.images.splice( i, 0, image );
					
					// Return out - nothing else to do.
					return;

				}

			}

			// If we made it this far, the image was not been inserted - just add to the end.
			$scope.images.push( image );
			
		}


		function loadRemoteData() {

			imagesService.getAllImages().then(
				function getAllImagesSuccess( response ) {

					applyRemoteData( response );

				},
				function getAllImagesError( error ) {


					alert( "Oops! " + error );

				}
			);

		}

	}
);
