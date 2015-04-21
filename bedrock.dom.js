(function (bedrock) {

    'use strict';

    var dom = {}, 
        find,
        filter,
        findMap,
        matchMap,
        InvalidFinder = Error;



    var _regexPattren;

    // Node type enum
    var nodeTypes = {
        ELEMENT_NODE: 1,
        ATTRIBUTE_NODE: 2,
        TEXT_NODE: 3,
        CDATA_SECTION_NODE: 4,
        ENTITY_REFERENCE_NODE: 5,
        ENTITY_NODE: 6,
        PROCESSING_INSTRUCTION_NODE: 7,
        COMMENT_NODE: 8,
        DOCUMENT_NODE: 9,
        DOCUMENT_TYPE_NODE: 10,
        DOCUMENT_FRAGMENT_NODE: 11,
        NOTATION_NODE: 12
    };

    // 
    var cssNumericalProperty = {
        'zIndex':     true,
        'fontWeight': true,
        'opacity':    true,
        'zoom':       true,
        'lineHeight': true
    };


    function _regexPatternBuilder() {

        var macros = {
            'nl'       : '\n|\r\n|\r|\f',
            'nonascii' : '[^\x00-\x7F]',
            'unicode'  : '\\[0-9A-Fa-f]{1,6}(\r\n|[\s\n\r\t\f])?',
            'escape'   : '#{unicode}|\\[^\n\r\f0-9A-Fa-f]',
            'nmchar'   : '[_A-Za-z0-9-]|#{nonascii}|#{escape}',
            'nmstart'  : '[_A-Za-z]|#{nonascii}|#{escape}',
            'ident'    : '[-@]?(#{nmstart})(#{nmchar})*',
            'name'     : '(#{nmchar})+'
        }; 

        var rules = {
            'id and name' : '(#{ident}##{ident})',
            'id' : '(##{ident})',
            'class' : '(\\.#{ident})',
            'name and class': '(#{ident}\\.#{ident})',
            'element' : '(#{ident})',
            'pseudo class': '(#{ident})'
        };

        function replacePattern(pattern, patterns) {
            var matched = true, match;
            
            while(matched){
                match = pattern.match(/#\{([^}]+)\}/);
                if(match && match[1]) {
                    pattern = pattern.replace(new RegExp('#\{' + match[1] + '\}', 'g'), patterns[match[1]]);    
                    matched = true; 
                } else {
                    // failed to tokenize
                    matched = false;
                }
            }
            
            return pattern;
        }

        function escapePattren(text) {
            return text.replace(/\//g, '//');
        }

        function convertPattrens() {
            var key, pattern, results = {}, patterns, source;

            if(arguments.length === 2) {
                source = arguments[0];
                patterns = arguments[1];
            } else {
                source = arguments[0];
                patterns = arguments[0];
            }

            for(key in patterns) {
                pattern = escapePattren(replacePattern(patterns[key], source));
                results[key] = pattern;
            }

            return results;
        }

        function joinPattrens(regexps) {
            var results = [], key;
            for(key in regexps) {
                results.push(regexps[key]);
            }
            return new RegExp(results.join('|'), 'g');
        }

        return joinPattrens(
            convertPattrens(convertPattrens(macros), rules)
        );

    }

    /* Build regex pattern which we will use to  
     * extract individual selectors
    */
    _regexPattern = _regexPatternBuilder();

    /* Hash map for the find function,
     * using this the element is searched on the dom   
    */
    find = {
        byId: function(root, id) {
            if(root === null) {
                return [];va
            }
            return [root.getElementById(id)];
        },

        byNodeName: function(root, tagName) {
            if(root === null) {
                return [];
            }
            var i, results = [], nodes = root.getElementsByTagName(tagName);
            for(i = 0; i < nodes.length; i++) {
                results.push(nodes[i]);
            }

            return results;
        },

        byClassName: function(root, className) {
            if(root === null) {
                return [];
            }
            var i, results = [], nodes = root.getElementsByTagName('*');
            for(i = 0; i < nodes.length; i++) {
                if(nodes[i].className.match('\\b' + className + '\\b')) {
                    results.push(nodes[i]);
                }
            }
            return results;
        }

    };

    filter = {
        byAttr: function(elements, attribute, value) {
            var key, results = [];
            for(key in elements) {
                if(elements[key] && elements[key][attribute] === value) {
                    results.push(elements[key]);
                }
            }

            return results;
        }
    };

    findMap = { 
        'id': function(root, selector) {
            selector = selector.split('#')[1];
            return find.byId(root, selector);
        },

        'name and id': function(root, selector) {
            var matches = selector.split('#'), name, id;
            name = matches[0];
            id = matches[1];
            return filter.byAttr(find.byId(root, id), 'nodeName', name.toUpperCase());
        },

        'name': function(root, selector) {
            return find.byNodeName(root, selector);
        },

        'class': function(root, selector) {
            selector = selector.split('\.')[1];
            return find.byClassName(root, selector);
        },

        'name and class': function(root, selector) {
            var matches = selector.split('\.'), name, className;
            name = matches[0];
            className = matches[1];

            return filter.byAttr(find.byClassName(root, className), 'nodeName', name.toUpperCase());
        }


    };



    matchMap = {
        
        'id' : function(element, selector) {
            selector = selector.split('#')[1];
            return element && element.id === selector;
        },

        'name': function(element, selector) {
            return element.nodeName === nodeName.toUpperCase();
        },

        'name and id': function(element, selector) {
            return matchMap.id(element, selector) && matchMap.name(element, selector);
        },

        'class': function(element, selector) {
            if(element && element.className) {
                selector = selector.split('\.')[1];
                return element.className.match('\\b' + selector + '\\b');
            }
        },

        'name and class': function(element, selector) {
            return matchMap['class'](element, selector) && matchMap.name(element, selector.split('\.')[0]);
        }

    };

    function normalize(text) {
        return text.replace(/^\s+|\s+$/g, '').replace(/[ \t\r\n\f]+/g, ' ');
    }
    
    // A Token is a pair of identity and the function to match taht identity
    function Token(identity, finder) {
        this.identity = identity;
        this.finder = finder;
    }

    Token.prototype.toString = function() {
        return 'identity: ' + this.identity + ', finder: ' + this.finder;
    }

    // Tokenizer object
    function Tokenizer(selector) {
        this.selector = normalize(selector);
        this.tokens = [];
        this.tokenize();
    }

    // Breaks down the selector into an array of tokens
    Tokenizer.prototype.tokenize = function() {
        var match, r, finder;

        r = _regexPattern;
        r.lastIndex = 0;

        
        while((match = r.exec(this.selector)) !== null) {
            finder = null;
           
            if(match[10]) {
                finder = 'id';
            } else if(match[1]){
                finder = 'name and id';
            } else if(match[29]) {
                finder = 'name';
            } else if(match[15]){
                finder = 'class';
            } else if(match[20]) {
                finder = 'name and class';
            }

            this.tokens.push(new Token(match[0], finder));
            
        }

        return this.tokens;
    }

    Tokenizer.prototype.finders = function() {
        var i, results = [];
        for(i in this.tokens) {
            results.push(this.tokens[i].finder);
        }
        
        return results;
    }

    function Searcher(root, tokens) {
        this.root = root;
        this.key_selector = tokens.pop();
        this.tokens = tokens;
        this.results = [];
    }

    Searcher.prototype.matchesToken = function(element, token) {
        if(!matchMap[token.finder]) {
            throw new InvalidFinder('Invalide matcher: ' + token.finder);
        }
        return matchMap[token.finder](element, token.identity);
    };

    Searcher.prototype.find = function(token){
        if(!findMap[token.finder]){
            throw new InvalidFinder('Invalid finder: ' + token.finder);
        }

        return findMap[token.finder](this.root, token.identity);
    };

    Searcher.prototype.matchAllRules = function(element){

        if(this.tokens.lenght === 0) {
            return;
        }

        var i = this.tokens.length - 1;
            token = this.tokens[i];
            matchFound = false;


        while( i >= 0 && element) {
            if(this.matchesToken(element, token)) {
                matchFound = true;
                i--;
                token = this.tokens[i];
                    
            }

            element = element.parentNode;
        }

        return matchFound && i < 0;
    };

    Searcher.prototype.parse = function() {
        var i, element, elements = this.find(this.key_selector), results = [];

        for(i = 0; i < elements.length; i++) {
            element = elements[i];
            
            if(this.tokens.length > 0){
                if(this.matchesAllRules(element.parentNode)) {
                    results.push(element);
                }
            } else {
                if(this.matchesToken(element, this.key_selector)){
                    results.push(element);
                }
            }
        }

        return results;
    };

    Searcher.prototype.values = function() {
        return this.results;
    };


    dom.tokenize = function(selector) {
        var tokenizer = new Tokenizer(selector);
        return tokenizer;
    };

    function _get(selector, root) {
        var tokens = dom.tokenize(selector).tokens,
            searcher = new Searcher(root, tokens);
        
        return searcher.parse();
    }

    function _camelCase(text){
        if(typeof text !== 'string') {
            return;
        }
        cosole.log(text);
        return text.replace(/-([a-z])/ig, function(all, letter) { return letter.toUpperCase();});
    }

    function uncamel(text){
        if(typeof text !== 'string') { 
            return;
        }

        return text.replace(/([A-Z])/g, '-$1').toLowerCase();
    }

    // Check if a node can 
    function _invalidCSSNode(element) {
        return !element || element.nodeType === nodeTypes.TEXT_NODE || element.nodeType === nodeTypes.COMMENT_NODE;
    }

    function _setStyleProperty(element, property, value) {
            
            if(_invalidCSSNode(element)) {
                return ;
            }

            if( typeof value === 'number' && !cssNumericalProperty[property]){
                value += 'px';
            }

            element.style[property] = value;

    }

    dom.css = function(element, options) {

        var getStyle, setStyle;
      
        if(typeof document !== 'undefined') {
            if(document.documentElement.currentStyle) {
                getStyle = function(element, property) {
                    return element.currentStyle[_camelCase(property)];
                };

                setStyle = function(element, property, value) {
                      
                    return _setStyleProperty(element, _camelCase(property), value);
                };
            } else if(document.defaultView.getComputedStyle){
                getStyle = function(element, proerty){
                    return element.ownerDocument.defaultView.getComputedStyle(element, null)
                        .getPropertyValue(uncamel(property));
                };

                setStyle = function(element, property, value) {
                    return _setStyleProperty(element, property, value);
                }
            }
        }

        if(typeof options === 'string') {
            return getStyle(element, options);
        } else {
            for(var property in options) {

                if(options.hasOwnProperty(property)){
                    setStyle(element, property, options[property]);
                }
            }
        }
    };

    dom.get = function(selector){
        var root = typeof arguments[1] === 'undefined' ? document : arguments[1];

        return _get(selector, root);
    }

    function _manipulateDOM(element, html, callback) {
        var context = document,
            isTable = element.nodeName === 'TABLE',
            shim,
            div;

        div = context.createElement('div');
        div.innerHTML = '<' + element.nodeName + '>' + html + '</' + element.nodeName + '>';
        shim = isTable ? div.lastChild.lastChild : div.lastChild;
        callback(isTable ? element.lastChild : element, shim);
        div = null;
    }


    console.log("Bind!");
    bedrock.dom = dom;

    return dom;

}(bedrock));




