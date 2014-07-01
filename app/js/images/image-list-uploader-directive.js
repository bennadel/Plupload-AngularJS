
app.directive(
	"bnImageListUploader",
	function( $document, $rootScope, mOxie, naturalSort ) {

		// I bind the JavaScript events to the scope.
		function link( $scope, element, attributes ) {

			// I hold a reference to the current drop-indicator that the user is over. 
			// This is the one with the insertion line next to it.
			var activeDropIndicator = null;

			// Since drag events are a nightmare to work with (for real, I mean like 
			// really for real, they are horrible horrible things), we need to hack the
			// way we handle the de-activating of the element state. Instead of a true 
			// leave event, we're actually just going to use a timer that will be 
			// cancelled by the "drag" event, which fires continuously.
			var activeStateTeardownTimer = null;

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


			// I restart the activate state teardown timer, clearing it and then starting
			// it again.
			function restartActiveStateTeardownTimer() {

				stopActiveStateTeardownTimer();
				startActiveStateTeardownTimer();

			}


			// I set up the active state bindings.
			function setupActiveState() {

				element.addClass( "pending-drop" );

				// Since the drag events are basically a NIGHTMARE to work with, we can't
				// simply bind to the dragleave event and deactivate the state. Instead, 
				// we have to give the teardown a slight delay such that that a subsequent
				// "dragover" event may have a chance to cancel it.
				element.on(
					"dragleave", 
					function handleDragleaveList( event ) {

						restartActiveStateTeardownTimer();
						
					}
				);

				// Since the dragenter and dragleave events are impossible to work with 
				// across the different browsers, we're going to rely on the fact that
				// the dragover event fires continuously on the target element. Each time
				// this fires, we'll restart the "teardown" timer.
				// --
				// NOTE: This is horribly inefficient, but I don't know what else to do.
				element.on( 
					"dragover", 
					"div.drop-indicator div.left, div.drop-indicator div.right", 
					function( event ) {

						restartActiveStateTeardownTimer();

						// If this is just a repeat event, ignore it (optimization).
						if ( activeDropIndicator && ( activeDropIndicator[ 0 ] === this ) ) {

							return;

						// Turn off the previous drop indicator.
						} else if ( activeDropIndicator ) {

							activeDropIndicator.removeClass( "drop-here" );

						}

						activeDropIndicator = $( this ).addClass( "drop-here" );

					}
				);

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


			// I start the active state teardown timer.
			function startActiveStateTeardownTimer() {

				activeStateTeardownTimer = setTimeout(
					function() {

						teardownActiveState();
						setupWaitingState();

					},
					// This needs to be big enough to allow for the drag event to fire
					// at least once within the delayed interval.
					100 
				);

			}


			// I clear the active state teardown timer.
			function stopActiveStateTeardownTimer() {

				clearTimeout( activeStateTeardownTimer );

			}


			// I teardown the active state bindings.
			function teardownActiveState() {

				element
					.removeClass( "pending-drop" )
					.off( "dragover dragleave" )
				;

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
