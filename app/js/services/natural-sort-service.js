
app.factory(
	"naturalSort",
	function() {

		// I sort the given collection on the given top-level property using a natural 
		// sort that attempts to treat embedded numbers like real numbers.
		function sort( collection, property ) {

			collection.sort(
				function( a, b ) {

					// Normalize the file names with fixed-width numeric data.
					var aMixed = normalizeMixedDataValue( a[ property ] );
					var bMixed = normalizeMixedDataValue( b[ property ] );

					return( aMixed < bMixed ? -1 : 1 );

				}
			);
			
		}


		// Return factory value.
		return( sort );


		// ---
		// PRIVATE METHODS.
		// ---


		function normalizeMixedDataValue( value ) {

			var padding = "000000000000000";

			// Loop over all numeric values in the string and replace them with a value
			// of a fixed-width for both leading (integer) and trailing (decimal) padded
			// zeroes.
			value = value.replace(
				/(\d+)((\.\d+)+)?/g,
				function( $0, integer, decimal, $3 ) {

					// If this numeric value has "multiple" decimal portions, then the 
					// complexity is too high for this simple approach - just return the
					// padded integer.
					if ( decimal !== $3 ) {

						return(
							padding.slice( integer.length ) +
							integer +
							decimal
						);

					}

					decimal = ( decimal || ".0" );

					return(
						padding.slice( integer.length ) +
						integer +
						decimal +
						padding.slice( decimal.length )
					);

				}
			);

			return( value );

		}

	}
);
