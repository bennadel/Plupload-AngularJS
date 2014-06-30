
app.directive(
	"bnImageListUploader",
	function( $rootScope, mOxie, naturalSort, $document ) {

		// I bind the JavaScript events to the scope.
		function link( $scope, element, attributes ) {

			// I hold a reference to the current drop-indicator that the user is over. 
			// This is the one with the insertion line next to it.
			var activeDropIndicator = null;

			// Since drag events are a nightmare to work with, we need to handle the
			// "leave" event with a bit of a delay. When this timer goes off, it will
			// reset the drag-event handlers on the UI.
			var dragleaveListTimer = null;

			// Wiki: https://github.com/moxiecode/moxie/wiki/FileDrop
			var dropzone = new mOxie.FileDrop({
				drop_zone: element[ 0 ] 
			});

			// Initialize the dropzone events.
			dropzone.bind( "drop", handleFileDrop );
			dropzone.init();

			// We have to kill the drag-start event otherwise, dragging elements and text
			// around on the page will incorrectly trigger our drag workflow.
			element.on( "dragstart", handleDragStartList );

			// Prepare the list
			setupWaitingState();

			// When the scope is destroyed, clean up all bindings.
			$scope.$on(
				"$destroy",
				function( event ) {

					dropzone.destroy();

				}
			);


			// ---
			// PRIVATE METHODS.
			// ---


			// I handle dragevent on the document. If the event is triggered outside of 
			// the current element, then we will fallback to triggering a "leave" event
			// on the element so as to make up for the fact that working with the drag
			// events is a special kind of hell.
			function handleDocumentDragEnterLeaveHack( event ) {

				// 
				if ( ! activeDropIndicator ) {

					return;

				}

				if ( $( event.target ).closest( element ).length ) {

					return;

				}

				element.triggerHandler( "dragleave" );
			
			}


			// Since you can initiate drag-events from simply clicking and dragging on 
			// the screen, we don't want to confuse the file-based drag events. As such,
			// let's cancel any page-level drag events inside of the current element.
			function handleDragStartList( event ) {

				return( false );

			}


			// I handle the drop of the file onto list the list-based dropzone. When we
			// catch this event, we're going to prepare the file to include the sort; 
			// then, we're going to announce it so the other dropzone can know about it.
			function handleFileDrop( event ) {

				// If the user dropped multiple files, try to order the files using a 
				// natural sort that treats embedded numbers like actual numbers.
				naturalSort( dropzone.files, "name" );

				// If there is an active drop indicator, it means that the user dropped
				// the files into a particular portion of the list, not simply in the
				// general drop area. In such a case, we need to adjust the sort to 
				// reflect the user's selected location.
				if ( activeDropIndicator ) {

					// Get the sort from the image in the current scope.
					var sortIndex = activeDropIndicator.scope().image.sort;

					// By default, we'll insert before select insert position; but, 
					// if the "right" indicator was selected, we'll actually insert 
					// after the current position (ie, before the next item).
					if ( activeDropIndicator.is( ".right" ) ) {

						sortIndex++;

					}

					// Since the user may have dropped multiple files at one time, we 
					// have to adjust the sort of each file. If we don't then the files
					// will actually insert in reverse order. 
					for ( var i = 0, length = dropzone.files.length ; i < length ; i++ ) {

						dropzone.files[ i ].sort = ( sortIndex + i );

					}

				}

				// Announce the file drop so the main Plupload instance can get it.
				// --
				// NOTE: Normally, you would need to tell AngularJS about the use of 
				// the event system using an $apply() call; however, since all drop 
				// events, including the ones on the primary Plupload instance, tie into
				// the same workflow, we can safely defer the call to $apply() to the 
				// master Plupload instance.
				$rootScope.$broadcast( "imageFilesDropped", dropzone.files );

				// Move back to the waiting state.
				teardownActiveState();
				setupWaitingState();

			}


			// I set up the active state bindings.
			function setupActiveState() {

				element.addClass( "pending-drop" );

				// Since the drag events are basically a NIGHTMARE to work with, we can't
				// simply bind to the dragleave event. Instead, we have to give it a 
				// slight delay to give any subsequent drag events the ability to cancel
				// the "leave". This is especially annoying cross-browser.
				element.on(
					"dragleave", 
					function handleDragleaveList( event ) {

						console.log( "drag LEAVE element", now );

						clearTimeout( dragleaveListTimer );

						dragleaveListTimer = setTimeout(
							function() {

								teardownActiveState();
								setupWaitingState();

							},
							100
						);

					}
				);


				// Since the dragenter event is annoying to work with, especially cross-
				// browser, we're just going to use the dragover event. However, this 
				// event fires a LOT; as such, we need to ignore any duplicate events 
				// fired on the same element.
				element.on( 
					"dragover", 
					"div.drop-indicator div.left, div.drop-indicator div.right", 
					function( event ) {

						// If this is just a repeat event, ignore it.
						if ( activeDropIndicator && activeDropIndicator.is( this ) ) {

							return;

						// Turn off the previous drop indicator.
						} else if ( activeDropIndicator ) {

							activeDropIndicator.removeClass( "drop-here" );

						}

						activeDropIndicator = $( this ).addClass( "drop-here" );

						// Clear any currently active clear-timer (to make sure the 
						// pending-drop state doesn't close while we're still interacting
						// with the list).
						clearTimeout( dragleaveListTimer );

					}
				);


				$document.on( "dragleave",
					function( event ) {

						console.log( "DOC leave", event.target, event.relatedTarget );

					}
				);


				// This is a HACK to work with the janky-ass drag events. If we dragover
				// the item very fast, then we get the dragover event, but NOT the 
				// dragleave event. As such, we need a fallback to listen on the 
				// $document for a drag event
				// $document.on( "dragenter", handleDocumentDragEnterLeaveHack );
				// $document.on( "dragleave", handleDocumentDragEnterLeaveHack );

			}


			// I setup the waiting state bindings.
			function setupWaitingState() {

				element.one( 
					"dragover",
					function( event ) {

						setupActiveState();

					}
				);

			}


			// I teardown the active state bindings.
			function teardownActiveState() {

				element
					.removeClass( "pending-drop" )
					.off( "dragover dragleave" )
				;

				$document.off( "dragenter", handleDocumentDragEnterLeaveHack );
				$document.off( "dragleave", handleDocumentDragEnterLeaveHack );

				// If there is an active indicator, clear it.
				if ( activeDropIndicator ) {

					activeDropIndicator.removeClass( "drop-here" );
					activeDropIndicator = null;

				}

			}

		}


		// Return the directive configuration.
		return({
			link: link,
			restrict: "A"
		});

	}
);
