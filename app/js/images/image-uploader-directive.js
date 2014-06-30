
app.directive(
	"bnImageUploader",
	function( $rootScope, $document, plupload, mOxie, naturalSort ) {

		// I model the queue of files exposed by the uploader to the child DOM.
		function PublicQueue() {

			var queue = [];
			var fileIndex = {};


			queue.addFile = function( file ) {

				var item = {
					id: file.id,
					name: file.name,
					size: file.size,
					loaded: file.loaded,
					percent: file.percent.toFixed( 1 ),
					status: file.status,
					isQueued: ( file.status === plupload.QUEUED ),
					isUploading: ( file.status === plupload.UPLOADING ),
					isFailed: ( file.status === plupload.FAILED ),
					isDone: ( file.status === plupload.DONE )
				};

				fileIndex[ item.id ] = item;

				this.push( item );

			};


			queue.rebuild = function( files ) {

				this.splice( 0, this.length );

				fileIndex = {};

				for ( var i = 0, length = files.length ; i < length ; i++ ) {

					this.addFile( files[ i ] );

				}

			};


			queue.updateFile = function( file ) {

				if ( fileIndex.hasOwnProperty( file.id ) ) {

					var item = fileIndex[ file.id ];

					item.percent = file.percent.toFixed( 1 );
					item.loaded = file.loaded;
					item.percent = file.percent.toFixed( 1 );
					item.status = file.status;
					item.isQueued = ( file.status === plupload.QUEUED );
					item.isUploading = ( file.status === plupload.UPLOADING );
					item.isFailed = ( file.status === plupload.FAILED );
					item.isDone = ( file.status === plupload.DONE );

				}

			};


			return( queue );

		}


		// I bind the JavaScript events to the scope.
		function link( $scope, element, attributes ) {

			// The uploader has to refernece the browse button using an ID. Rather than
			// crudding up the HTML, just insert it here.
			element
				.attr( "id", "primaryUploaderContainer" )
				.find( "div.dropzone" )
					.attr( "id", "primaryUploaderDropzone" )
			;

			// Instantiate the Plupload uploader.
			var uploader = new plupload.Uploader({

				// For this demo, we're only going to use the html5 runtime. I don't 
				// want to have to deal with people who require flash - not this time, 
				// I'm tired of it.
				runtimes: "html5",

				// Upload the image to the API.
				url: "api/index.cfm?action=upload",

				// Set the name of file field (that conatins the upload).
				file_data_name: "file",

				// The ID of the drop-zone element.
				drop_element: "primaryUploaderDropzone",

				// To enable click-to-select-files, you can provide a browse button. 
				// We can use the same one as the drop zone.
				browse_button: "primaryUploaderDropzone",

				container: "primaryUploaderContainer",

				// We don't have any parameters yet; but, let's create the object now
				// so that we can simply consume it later in the BeforeUpload event.
				multipart_params: {}

			});

			// Initialize the plupload runtime.
			uploader.bind( "Error", handleError );
			uploader.bind( "PostInit", handleInit );
			uploader.bind( "FilesAdded", handleFilesAdded );
			uploader.bind( "QueueChanged", handleQueueChanged );
			uploader.bind( "BeforeUpload", handleBeforeUpload );
			uploader.bind( "UploadProgress", handleUploadProgress );
			uploader.bind( "FileUploaded", handleFileUploaded );
			uploader.bind( "StateChanged", handleStateChanged );
			uploader.init();

			// I provide access to the file list inside of the directive. This can be 
			// used to render the items being uploaded.
			$scope.queue = new PublicQueue();

			// Listen for drop events from other dropzones.
			$scope.$on( "imageFilesDropped", handleExternalFilesDropped );

			// When the scope is destroyed, clean up bindings.
			$scope.$on(
				"$destroy",
				function() {

					// ...

				}
			);
				

			// ---
			// PRIVATE METHODS.
			// ---


			// I handle the before upload event where the meta data can be edited right
			// before the upload of a specific file, allowing for per-file settings.
			function handleBeforeUpload( uploader, file ) {

				var params = uploader.settings.multipart_params;
				var source = file.getSource();

				// Delete any previous reference to sort.
				delete( params.sort );

				// If the dropped/selected file has a sort option, then send it through.
				if ( "sort" in source ) {

					params.sort = source.sort;

				}

			}


			// I handle errors that occur during intialization or general operation of
			// the Plupload instance.
			function handleError( uploader, error ) {

				console.warn( "Plupload error" );
				console.error( error );

			}


			// I handle the event in which a user had dropped files onto an attached 
			// dropzone - we just need to take those files and add them to the uploader.
			// This will initiate the normal files-added / queue-changed workflow.
			function handleExternalFilesDropped( event, files ) {

				uploader.addFile( files );

			}


			// I handle the files-added event. This is different that the queue-
			// changed event. At this point, we have an opportunity to reject files from 
			// the queue.
			function handleFilesAdded( uploader, files ) {

				// ------------------------------------------------------------------- //
				// BEGIN: JANKY SORTING HACK ----------------------------------------- //

				// This is a real hack; but, the files have actually ALREADY been added 
				// to the internal Plupload queue; as such, we need to actually overwrite
				// the files that were just added.
				
				// If the user selected or dropped multiple files, try to order the files 
				// using a natural sort that treats embedded numbers like actual numbers.
				naturalSort( files, "name" );

				var length = files.length;
				var totalLength = uploader.files.length;

				// Rewrite the sort of the newly added files.
				for ( var i = 0 ; i < length ; i++ ) {

					// Swap the original insert with the sorted insert.
					uploader.files[ totalLength - length + i ] = files[ i ];

				}

				// END: JANKY SORTING HACK ------------------------------------------- //
				// ------------------------------------------------------------------- //
				
				// $scope.$apply(
				// 	function() {

				// 		// Show the client-side preview using the loaded File.
				// 		for ( var i = 0, length = files.length ; i < length ; i++ ) {

				// 			// showImagePreview( files[ i ] );

				// 		}

				// 	}
				// );

			}


			// I handle the file-uploaded event. At this point, the image has been 
			// uploaded and thumbnailed - we can now load that image in our uploads list.
			function handleFileUploaded( uploader, file, response ) {

				$scope.$apply(
					function() {

						// Broudcast the response from the server.
						$rootScope.$broadcast( 
							"imageUploaded", 
							angular.fromJson( response.response )
						);

						// Remove the file from the internal queue.
						uploader.removeFile( file );
						
					}
				);

			}


			// I handle the init event. At this point, we will know which runtime has 
			// loaded, and whether or not drag-drop functionality is supported.
			// --
			// NOTE: For this build of Plupload, I had to switch from using the "Init"
			// event to the "PostInit" in order for the "dragdrop" feature to be 
			// correct defined.
			function handleInit( uploader, params ) {

				// console.log( "Initialization complete." );
				// console.log( "Drag-drop supported:", !! uploader.features.dragdrop );

			}


			// I handle the queue changed event. When the queue changes, it gives us an
			// opportunity to programmatically start the upload process.
			function handleQueueChanged( uploader ) {

				if ( uploader.files.length && isNotUploading() ){

					uploader.start();

				}

				$scope.queue.rebuild( uploader.files );

			}


			// I handle the change in state of the uploader.
			function handleStateChanged( uploader ) {

				if ( isUploading() ) {

					// dom.uploader.addClass( "uploading" );

				} else {

					// dom.uploader.removeClass( "uploading" );

				}

			}


			// I get called when progress is made on the given file.
			function handleUploadProgress( uploader, file ) {

				$scope.$apply(
					function() {

						$scope.queue.updateFile( file );

					}
				);

			}


			// I determine if the upload is currently inactive.
			function isNotUploading() {

				return( uploader.state === plupload.STOPPED );

			}


			// I determine if the uploader is currently uploading a file.
			function isUploading() {

				return( uploader.state === plupload.STARTED );

			}








			// I take the given File object (as presented by
			// Plupoload), and show the client-side-only preview of
			// the selected image object.
			function showImagePreview( file ) {

				var item = $( "<li></li>" ).prependTo( dom.uploads );
				var image = $( new Image() ).appendTo( item );

				// Create an instance of the mOxie Image object. This
				// utility object provides several means of reading in
				// and loading image data from various sources.
				// --
				// Wiki: https://github.com/moxiecode/moxie/wiki/Image
				var preloader = new mOxie.Image();

				// Define the onload BEFORE you execute the load()
				// command as load() does not execute async.
				preloader.onload = function() {

				// This will scale the image (in memory) before it
				// tries to render it. This just reduces the amount
				// of Base64 data that needs to be rendered.
				preloader.downsize( 100, 100 );

				// Now that the image is preloaded, grab the Base64
				// encoded data URL. This will show the image
				// without making an Network request using the
				// client-side file binary.
				image.prop( "src", preloader.getAsDataURL() );

				// NOTE: These previews "work" in the FLASH runtime.
				// But, they look seriously junky-to-the-monkey.
				// Looks like they are only using like 256 colors.

				};

				// Calling the .getSource() on the file will return an
				// instance of mOxie.File, which is a unified file
				// wrapper that can be used across the various runtimes.
				// --
				// Wiki: https://github.com/moxiecode/plupload/wiki/File
				preloader.load( file.getSource() );

			}

		}


		// Return the directive configuration.
		return({
			link: link,
			restrict: "A",
			scope: true
		});

	}
);
