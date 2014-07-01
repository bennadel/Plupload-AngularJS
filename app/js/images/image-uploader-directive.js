
app.directive(
	"bnImageUploader",
	function( $window, $document, $rootScope, $q, plupload, mOxie, naturalSort ) {

		// I model the queue of files exposed by the uploader to the child DOM.
		function PublicQueue() {

			// I contain the actual data structure that is exposed to the user.
			var queue = [];

			// I index the currently queued files by ID for easy reference.
			var fileIndex = {};


			// I add the given file to the public queue.
			queue.addFile = function( file ) {

				var item = {
					id: file.id,
					name: file.name,
					size: file.size,
					loaded: file.loaded,
					percent: file.percent.toFixed( 0 ),
					status: file.status,
					isUploading: ( file.status === plupload.UPLOADING )
				};

				this.push( fileIndex[ item.id ] = item );

			};


			// I rebuild the queue. 
			// --
			// NOTE: Currently, the implementation of this doesn't take into account any
			// optimizations for rendering. If you use "track by" in your ng-repeat, 
			// though, you should be ok.
			queue.rebuild = function( files ) {

				// Empty the queue.
				this.splice( 0, this.length );

				// Cleaer the internal index.
				fileIndex = {};

				// Add each file to the queue.
				for ( var i = 0, length = files.length ; i < length ; i++ ) {

					this.addFile( files[ i ] );

				}

			};


			// I update the percent loaded and state for the given file.
			queue.updateFile = function( file ) {

				// If we can't find this file, then ignore -- this can happen if the 
				// progress event is fired AFTER the upload event (which it does 
				// sometimes).
				if ( ! fileIndex.hasOwnProperty( file.id ) ) {

					return;

				}

				var item = fileIndex[ file.id ];

				item.loaded = file.loaded;
				item.percent = file.percent.toFixed( 0 );
				item.status = file.status;
				item.isUploading = ( file.status === plupload.UPLOADING );

			};


			return( queue );

		}


		// I bind the JavaScript events to the scope.
		function link( $scope, element, attributes ) {

			// The uploader has to refernece the various elements using IDs. Rather than
			// crudding up the HTML, just insert the values dynamically here.
			element
				.attr( "id", "primaryUploaderContainer" )
				.find( "div.dropzone" )
					.attr( "id", "primaryUploaderDropzone" )
			;

			// Instantiate the Plupload uploader.
			var uploader = new plupload.Uploader({

				// For this demo, we're only going to use the html5 runtime. I don't 
				// want to have to deal with people who require flash - not this time, 
				// I'm tired of it; plus, much of the point of this demo is to work with
				// the drag-n-drop, which isn't available in Flash.
				runtimes: "html5",

				// Upload the image to the API.
				url: "api/index.cfm?action=upload",

				// Set the name of file field (that contains the upload).
				file_data_name: "file",

				// The container, into which to inject the Input shim.
				container: "primaryUploaderContainer",

				// The ID of the drop-zone element.
				drop_element: "primaryUploaderDropzone",

				// To enable click-to-select-files, you can provide a browse button. 
				// We can use the same one as the drop zone.
				browse_button: "primaryUploaderDropzone",

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

			// Wrap the window instance so we can get easy event binding.
			var win = $( $window );

			// When the window is resized, we'll have to update the dimensions of the 
			// input shim.
			win.on( "resize", handleWindowResize );

			// Listen for drop events from other dropzones.
			$scope.$on( "imageFilesDropped", handleExternalFilesDropped );

			// When the scope is destroyed, clean up bindings.
			$scope.$on(
				"$destroy",
				function() {

					win.off( "resize", handleWindowResize );
					
					uploader.destroy();

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


			// I handle the event in which a user has dropped files onto an attached 
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

				// Tell AngularJS that something has changed (the public queue will have 
				// been updated at this point).
				$scope.$apply();
				
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
			function handleInit( uploader, params ) {

				// console.log( "Initialization complete." );
				// console.log( "Drag-drop supported:", !! uploader.features.dragdrop );

			}


			// I handle the queue changed event. When the queue changes, it gives us an
			// opportunity to programmatically start the upload process. This will be 
			// triggered when files are both added to or removed (programmatically) from
			// the list (respectively).
			function handleQueueChanged( uploader ) {

				if ( uploader.files.length && isNotUploading() ){

					uploader.start();

				}

				$scope.queue.rebuild( uploader.files );

			}


			// I handle the change in state of the uploader.
			function handleStateChanged( uploader ) {

				if ( isUploading() ) {

					element.addClass( "uploading" );

				} else {

					element.removeClass( "uploading" );

				}

			}


			// I get called when upload progress is made on the given file.
			// --
			// CAUTION: This may get called one more time after the file has actually
			// been fully uploaded AND the uploaded event has already been called.
			function handleUploadProgress( uploader, file ) {

				$scope.$apply(
					function() {

						$scope.queue.updateFile( file );

					}
				);

			}


			// I handle the resizing of the browser window, which causes a resizing of 
			// the input-shim used by the uploader.
			function handleWindowResize( event ) {

				uploader.refresh();

			}


			// I determine if the upload is currently inactive.
			function isNotUploading() {

				return( uploader.state === plupload.STOPPED );

			}


			// I determine if the uploader is currently uploading a file.
			function isUploading() {

				return( uploader.state === plupload.STARTED );

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
