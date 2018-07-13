/**
 * Created by nmasuki on 9/15/2017.
 */
var Crawler = require("crawler");

function MyCrawler(handler) {
	handler = handler || require("./helpers/crawler_url_handeler");
	var links = [];
	var c = new Crawler({
		rateLimit: 100,
		maxConnections: 3,
		// This will be called for each crawled page
		callback: function (error, res, done) {
			if (error) {
				console.log(error);
			} else {
				var $ = res.$;
				var json = res.toJSON();

				// $ is Cheerio by default
				//a lean implementation of core jQuery designed specifically for the server
				var newLinks = [];
				var uri = json.request.uri;

				if (typeof $ == "function") {
					$("a").each(function (i, b) {
						var href = b.attribs.href;
						if (!href || href[0] == '#' || /(mailto\:)/i.test(href)) return;

						if (href.indexOf("://") < 0) {
							var pathEscaped = uri.path.replace(/[-[\]{}()*+!<=:?.\/\\^$|#\s,]/g, '\\$&');
							var pathReg = new RegExp("(" + pathEscaped + ")$")
							var url = uri.href.replace(pathReg, "");
							if (href[0] === '/')
								href = url + href;
							else
								href = url + '/' + href;
						}

						if (href && links.indexOf(href) < 0 && newLinks.indexOf(href) < 0 && href.indexOf(uri.host) > 0) {
							newLinks.push(href);
						}
					});

					links = links.concat(newLinks);

					if (newLinks && newLinks.length)
						newLinks.forEach(l => c.queue(l));

					var title = $("title").text().trim()
						.replace(/\ I\ /g, " | ")
						.replace(/\ l\ /g, " | ")
						.replace(/\|/g, "SEPARATOR")
						.replace(/\-/g, " SEPARATOR ")
						.replace(/\s+/g, " ")
						.replace(/(SEPARATOR)+/g, "|")					
						.replace(/\s+/g, " ")
						.replace(/(\|\s*\|)+/g, "|");

					var index = title.lastIndexOf("|");
					if (index > 0) 
						title = title.substr(0,index) + "-" + title.substr(index+1);					

					//console.log(title + ".", uri.href, newLinks.length ? newLinks.length + " links found." : "");
					if (handler && typeof handler[uri.host] == "function")
						handler[uri.host]($, uri, json, done);
					else
						console.log(`No handler found for '${uri.host}'!`)
				}

			}
			done();
		}
	});

	this.crawl = function () {
		var done = Array.from(arguments).last(a => typeof a == "function");
		Array.from(arguments).filter(l => {
			return l && /(http|ftp)/.test(l.toString())
		}).forEach(l => c.queue(l));

		
		var _done = false;
		c.on('drain', function () {
			if (!_done && typeof done == "function")			{
				_done = true;
				done();
				console.log("Crawling done..")
			}
		});
	}
}

module.exports = MyCrawler;





