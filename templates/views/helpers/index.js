var moment = require('moment');
var _ = require('underscore');
var hbs = require('handlebars');
var keystone = require('keystone');
var cloudinary = require('cloudinary');

// Collection of templates to interpolate
var linkTemplate = _.template('<a href="<%= url %>"><%= text %></a>');
var scriptTemplate = _.template('<script src="<%= src %>"></script>');
var cssLinkTemplate = _.template('<link href="<%= href %>" rel="stylesheet">');

module.exports = function () {

    var _helpers = {};

    /**
     * Generic HBS Helpers
     * ===================
     */


    /**
     * Port of Ghost helpers to support cross-theming
     * ==============================================
     *
     * Also used in the default keystonejs-hbs theme
     */

    // ### Date Helper
    // A port of the Ghost Date formatter similar to the keystonejs - jade interface
    //
    //
    // *Usage example:*
    // `{{date format='MM YYYY}}`
    // `{{date publishedDate format='MM YYYY'`
    //
    // Returns a string formatted date
    // By default if no date passed into helper than then a current-timestamp is used
    //
    // Options is the formatting and context check this.publishedDate
    // If it exists then it is formated, otherwise current timestamp returned

    _helpers.date = function (context, options) {
        if (!options && context.hasOwnProperty('hash')) {
            options = context;
            context = undefined;

            if (this.publishedDate) {
                context = this.publishedDate;
            }
        }

        // ensure that context is undefined, not null, as that can cause errors
        context = context === null ? undefined : context;

        var f = options.hash.format || 'MMM Do, YYYY';
        var timeago = options.hash.timeago;
        var date;

        // if context is undefined and given to moment then current timestamp is given
        // nice if you just want the current year to define in a tmpl
        if (timeago) {
            date = moment(context).fromNow();
        } else {
            date = moment(context).format(f);
        }
        return date;
    };

    // ### Category Helper
    // Ghost uses Tags and Keystone uses Categories
    // Supports same interface, just different name/semantics
    //
    // *Usage example:*
    // `{{categoryList categories separator=' - ' prefix='Filed under '}}`
    //
    // Returns an html-string of the categories on the post.
    // By default, categories are separated by commas.
    // input. categories:['tech', 'js']
    // output. 'Filed Undder <a href="blog/tech">tech</a>, <a href="blog/js">js</a>'

    _helpers.categoryList = function (categories, options) {
        var autolink = _.isString(options.hash.autolink) && options.hash.autolink === 'false' ? false : true;
        var separator = _.isString(options.hash.separator) ? options.hash.separator : ', ';
        var prefix = _.isString(options.hash.prefix) ? options.hash.prefix : '';
        var suffix = _.isString(options.hash.suffix) ? options.hash.suffix : '';
        var output = '';

        function createTagList(tags) {
            var tagNames = _.pluck(tags, 'name');

            if (autolink) {
                return _.map(tags, function (tag) {
                    return linkTemplate({
                        url: ('/blog/' + tag.key),
                        text: _.escape(tag.name),
                    });
                }).join(separator);
            }
            return _.escape(tagNames.join(separator));
        }

        if (categories && categories.length) {
            output = prefix + createTagList(categories) + suffix;
        }
        return new hbs.SafeString(output);
    };

    /**
     * KeystoneJS specific helpers
     * ===========================
     */

    // block rendering for keystone admin css
    _helpers.isAdminEditorCSS = function (user, options) {
        var output = '';
        if (user  && user.isAdmin) {
            output = cssLinkTemplate({
                href: '/admin/styles/content/editor.min.css',
            });
        }
        return new hbs.SafeString(output);
    };

    // block rendering for keystone admin js
    _helpers.isAdminEditorJS = function (user, options) {
        var output = '';
        if (user && user.isAdmin) {
            output = scriptTemplate({
                src: '/admin/js/content/editor.js',
            });
        }
        return new hbs.SafeString(output);
    };

    // Used to generate the link for the admin edit post button
    _helpers.adminEditableUrl = function (user, options) {
        var rtn = keystone.app.locals.editable(user, {
            list: 'Blog',
            id: options,
        });
        return rtn;
    };

    // ### CloudinaryUrl Helper
    // Direct support of the cloudinary.url method from Handlebars (see
    // cloudinary package documentation for more details).
    //
    // *Usage examples:*
    // `{{{cloudinaryUrl image width=640 height=480 crop='fill' gravity='north'}}}`
    // `{{#each images}} {{cloudinaryUrl width=640 height=480}} {{/each}}`
    //
    // Returns an src-string for a cloudinary image

    _helpers.cloudinaryUrl = function (context, options) {
       
        if (typeof context == "string")
            return context;

        // if we dont pass in a context and just kwargs
        // then `this` refers to our default scope block and kwargs
        // are stored in context.hash
        if (!options && context.hasOwnProperty('hash')) {
            // strategy is to place context kwargs into options
            options = context;
            // bind our default inherited scope into context
            context = this;
        }

        //delete options.height;
        //delete options.width;
        //delete options.crop;

        // safe guard to ensure context is never null
        context = context === null ? undefined : context;

        if ((context) && (context.public_id)) {
            options.hash.secure = keystone.get('cloudinary secure') || false;
            var imageName = context.public_id.concat('.', context.format);
            return cloudinary.url(imageName, options.hash);
        }
        else {
            return null;
        }
    };

    // ### Content Url Helpers
    // KeystoneJS url handling so that the routes are in one place for easier
    // editing.  Should look at Django/Ghost which has an object layer to access
    // the routes by keynames to reduce the maintenance of changing urls

    // Page SEO handlers
    _helpers.seo = function (path) {
        var seo = require("./seo");
        var parts = path.split("/");

        var ret = seo, i = 0;
        while (parts[i] && ret[parts[i]]) {
            ret = ret[parts[i++]];
        }

        return ret || seo.home;
    };

    _helpers.seoTitle = function (path) {
        return _helpers.seo(path).title;
    };

    _helpers.seoMeta = function (path) {
        return _helpers.seo(path).meta;
    };

    _helpers.cartItemCount = function (locals) {
        if (locals.cartItems) {
            var count = Object.values(locals.cartItems || {})
                .sum(c => c.pieces);

            return count || "";
        } else {
            return "";
        }
    };

    _helpers.json = function(context){
        return JSON.stringify(context);
    }

    _helpers.formatNumber = function (n, d) {
        return parseFloat(n).format(d || 2);
    }

    _helpers.properCase = _helpers.propercase = function (a) {
        return (a || "").toLowerCase().toProperCase()
    };

    _helpers.titleReplacePipe = function (a) {
        return (a || "").replace(' I ', " | ");
    }

    _helpers.contains = function (a, b) {
        return (a || "").toString().contains(b);
    };

    _helpers.for = function (from, to, incr, block) {
        var accum = '';
        for (var i = from; i <= to; i += incr) {
            this["@index"] = i;
            accum += block.fn(this, i);
        }
        return accum;
    };

    _helpers.foreachkey = function (obj, block) {
        if(!obj || !Object.keys(obj).length)
            return block.inverse(this);
        
        var accum = "";
        for(var i in Object.keys(obj)){
            accum += block.fn(this, i);
        }
        return accum;
    };

    _helpers.json = function(obj){
        try{
            return JSON.stringify(obj);
        }catch(e){
            console.log("Error while running JSON.stringify on", obj, e);
        }
    }

    //Comparison helpers
    _helpers = Object.assign(_helpers, {
        eq: function (v1, v2, options) {
            return v1 === v2;
        },
        ne: function (v1, v2, options) {
            return v1 !== v2;
        },
        lt: function (v1, v2, options) {
            return v1 < v2;
        },
        gt: function (v1, v2, options) {
            return v1 > v2;
        },
        lte: function (v1, v2, options) {
            return v1 <= v2;
        },
        gte: function (v1, v2, options) {
            return v1 >= v2;
        },

        ifeq: function (v1, v2, options) {
            return v1 === v2 ? options.fn(this) : options.inverse(this);
        },
        ifne: function (v1, v2, options) {
            return v1 !== v2 ? options.fn(this) : options.inverse(this);
        },
        iflt: function (v1, v2, options) {
            return v1 < v2 ? options.fn(this) : options.inverse(this);
        },
        ifgt: function (v1, v2, options) {
            return v1 > v2 ? options.fn(this) : options.inverse(this);
        },
        iflte: function (v1, v2, options) {
            return v1 <= v2 ? options.fn(this) : options.inverse(this);
        },
        ifgte: function (v1, v2, options) {
            return v1 >= v2 ? options.fn(this) : options.inverse(this);
        },
        and: function () {
            return Array.prototype.slice.call(arguments).every(Boolean);
        },
        or: function () {
            return Array.prototype.slice.call(arguments, 0, -1).some(Boolean);
        },
        prod: function (v1, v2) {
            return v1 * v2;
        },
        div: function (v1, v2) {
            return v1 % v2 === 0;
        },
        sumEvals: function (a, fnStr) {
            return a.sum(eval(fnStr))
        }
    });

    _helpers.x = function (expression, options) {
        var result;

        // you can change the context, or merge it with options.data, options.hash
        var context = this;

        // yup, i use 'with' here to expose the context's properties as block variables
        // you don't need to do {{x 'this.age + 2'}}
        // but you can also do {{x 'age + 2'}}
        // HOWEVER including an UNINITIALIZED var in a expression will return undefined as the result.
        with (context) {
            result = (function () {
                try {
                    var _eval = eval(expression);
                    return _eval;
                } catch (e) {
                    console.warn('•Expression: {{x \'' + expression + '\'}}\n•JS-Error: ', e, '\n•Context: ', context);
                }
            }).call(context); // to make eval's lexical this=context
        }
        return result;
    };

    _helpers.formatDate = function (datetime, format) {
        if (moment && datetime) {
            // can use other formats like 'lll' too
            return moment(datetime).format(format || 'MM Do, YYYY');
        }
        else {
            return datetime;
        }
    }

    _helpers.stringify = function (obj) {
        return JSON.stringify(obj)
    }

    _helpers.lowerCase = function (str) {
        return (str || "").toLowerCase();
    };

    _helpers.urlencode = function(str){
        return encodeURIComponent(str);
    };

    _helpers.truncate = function (str, length) {
        return (str || "").truncate(length, '...');
    };

    _helpers.trimRight = function (str, charlist) {
        return (str || "").trimRight(charlist);
    };
    
    _helpers.trimLeft = function (str, charlist) {
        return (str || "").trimLeft(charlist);
    };
    
    _helpers.trim = function (str, charlist) {
        return (str || "").trim(charlist);
    };

    _helpers.cleanId = function(str){
        return (str || "").cleanId();
    }

    _helpers.cleanHtml = function(str){
        return (str || "").replace(/<(?:.|\n)*?>/gm, '').replaceAll("\"", "\\\"");
    };

    // Direct url link to a specific brand
    _helpers.brandUrl = function (brandSlug, options) {
        return ('/brand/' + brandSlug);
    };

    // Direct url link to a specific product
    _helpers.productUrl = function (productSlug, options) {
        return ('/' + productSlug);
    };

    // Direct url link to a specific post
    _helpers.postUrl = function (postSlug, options) {
        return ('/blog/' + postSlug);
    };

    // might be a ghost helper
    // used for pagination urls on blog
    _helpers.pageUrl = function (pageNumber, options) {
        return '?page=' + pageNumber;
    }

    // create the category url for a blog-category page
    _helpers.categoryUrl = function (categorySlug, options) {
        return ('/blog/cat/' + categorySlug);
    };

    // ### Pagination Helpers
    // These are helpers used in rendering a pagination system for content
    // Mostly generalized and with a small adjust to `_helper.pageUrl` could be universal for content types

    /*
    * expecting the data.blogs context or an object literal that has `previous` and `next` properties
    * ifBlock helpers in hbs - http://stackoverflow.com/questions/8554517/handlerbars-js-using-an-helper-function-in-a-if-statement
    * */
    _helpers.ifHasPagination = function (postContext, options) {
        // if implementor fails to scope properly or has an empty data set
        // better to display else block than throw an exception for undefined
        if (_.isUndefined(postContext)) {
            return options.inverse(this);
        }
        if (postContext.next || postContext.previous) {
            return options.fn(this);
        }
        return options.inverse(this);
    };

    _helpers.paginationNavigation = function (pages, currentPage, totalPages, options) {
        var html = '';

        // pages should be an array ex.  [1,2,3,4,5,6,7,8,9,10, '....']
        // '...' will be added by keystone if the pages exceed 10
        _.each(pages, function (page, ctr) {
            // create ref to page, so that '...' is displayed as text even though int value is required
            var pageText = page;
            // create boolean flag state if currentPage
            var isActivePage = ((page === currentPage) ? true : false);
            // need an active class indicator
            var liClass = ((isActivePage) ? ' class="active"' : '');

            // if '...' is sent from keystone then we need to override the url
            if (page === '...') {
                // check position of '...' if 0 then return page 1, otherwise use totalPages
                page = ((ctr) ? totalPages : 1);
            }

            // get the pageUrl using the integer value
            var pageUrl = _helpers.pageUrl(page);
            // wrapup the html
            html += '<li' + liClass + '>' + linkTemplate({url: pageUrl, text: pageText}) + '</li>\n';
        });
        return html;
    };

    // special helper to ensure that we always have a valid page url set even if
    // the link is disabled, will default to page 1
    _helpers.paginationPreviousUrl = function (previousPage, totalPages) {
        if (previousPage === false) {
            previousPage = 1;
        }
        return _helpers.pageUrl(previousPage);
    };

    // special helper to ensure that we always have a valid next page url set
    // even if the link is disabled, will default to totalPages
    _helpers.paginationNextUrl = function (nextPage, totalPages) {
        if (nextPage === false) {
            nextPage = totalPages;
        }
        return _helpers.pageUrl(nextPage);
    };


    //  ### Flash Message Helper
    //  KeystoneJS supports a message interface for information/errors to be passed from server
    //  to the front-end client and rendered in a html-block.  FlashMessage mirrors the Jade Mixin
    //  for creating the message.  But part of the logic is in the default.layout.  Decision was to
    //  surface more of the interface in the client html rather than abstracting behind a helper.
    //
    //  @messages:[]
    //
    //  *Usage example:*
    //  `{{#if messages.warning}}
    //      <div class="alert alert-warning">
    //          {{{flashMessages messages.warning}}}
    //      </div>
    //   {{/if}}`

    _helpers.flashMessages = function (messages) {
        var output = '';
        for (var i = 0; i < messages.length; i++) {

            if (messages[i].title) {
                output += '<h4>' + messages[i].title + '</h4>';
            }

            if (messages[i].detail) {
                output += '<p>' + messages[i].detail + '</p>';
            }

            if (messages[i].list) {
                output += '<ul>';
                for (var ctr = 0; ctr < messages[i].list.length; ctr++) {
                    output += '<li>' + messages[i].list[ctr] + '</li>';
                }
                output += '</ul>';
            }
        }
        return new hbs.SafeString(output);
    };


    //  ### underscoreMethod call + format helper
    //	Calls to the passed in underscore method of the object (Keystone Model)
    //	and returns the result of format()
    //
    //  @obj: The Keystone Model on which to call the underscore method
    //	@undescoremethod: string - name of underscore method to call
    //
    //  *Usage example:*
    //  `{{underscoreFormat enquiry 'enquiryType'}}

    _helpers.underscoreFormat = function (obj, underscoreMethod) {
        return obj._[underscoreMethod].format();
    };

    return _helpers;
};
