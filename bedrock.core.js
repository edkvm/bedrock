
(function(global) {

	bedrock = function() {

	}

	bedrock.VERSION = '0.0.1';

	if(typeof window !== 'undefined') {
		bedrock.alias = window.__bedrock_alias || '$bd';
		window[bedrock.alias] = bedrock;
	}

	bedrock.toArray = function(collection) {
		var results = [], i;
		for(i = 0; i < collectiom.length; i++){
			results.push(collection[i]);
		}
		return results;
	};


	// EXPOSE
	if( typeof define === "function" && define.amd) {
		define(function () { return bedrock; });
	} else if ( typeof module !== "undefined" && module.exports) {
		module.exports = bedrock;
	} else {
		global.bedrock = bedrock;
	}
	// EXPOSE

	
}(typeof window === 'undefined' ? this : window));