"use strict";

bedrock.Class = function() {
		return baserock.oo.create.apply(this, arguments);
}

bedrock.oo = {
		
		create : function(methods) {
			var klass = function(){
				this.initialize.apply(this, arguments);

			};

			extend(klass.prototype, methods);

			klass.prototype.constructor = klass;

			if(!klass.prototype.initialize){
				klass.prototype.initialize = function(){};
			}

			return klass;
		},

		mixin: function(klass, methods) {
			if(typeof methods.include !== 'undefined'){
				if(typeof methods.include === 'function'){
					baserock.oo.extend(klass.prototype, methods.include.prototype);
				} else {
					for(var i = 0; i < methods.include.length; i++){
						baserock.oo.extend(klass.prototypem methods.include[i].prototype);
					}
				}
			}
		},

		extend: function(destination, source){
			for(var property in source){
				destination[property] = source[property];
			}	
			return destination;
		}
	}

	baserock.Class = Class;
	baserock.oo = oo;

	return oo;
};