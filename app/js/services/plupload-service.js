
app.factory(
	"plupload",
	function() {

		// Return the global Plupload reference so that it can be injected, 
		// proper-like, into our directives.
		return( plupload );

	}
);

app.factory(
	"mOxie",
	function() {

		// Return the global mOxie reference so that it can be injected, 
		// proper-like, into our directives.
		return( mOxie );

	}
);
