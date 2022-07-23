var memCache = require("memory-cache");

function escapeRegex(str) {
	return str.replace(/[-[/\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

function expandLuceneRange(filter) {
	var regex = /([\w\.\$(\[\])]+):\s*([\[\{])([^\s]+)\sTO\s([^\]\}]+)([\]\}])/gm;
	if (regex.test(filter)) {
		var str = filter.replace(regex, (value, a, b, c, d, e, f, g) => {
			var openingBrack = value[0] == '(';
			var clossingBrack = value[value.length - 1] == ')';

			var match = Array.from(value.trim('()').matchAll(regex))[0]
			var parts = [match[1], match[3], match[4], match[2], match[5]]
				.map(v => (v || "").trim().trim('"', '*', ' '))

			var _str = ""; //string.Format("{0}>{1} AND {0}<{2}", parts[1], parts[2], parts[3]);
			if (parts[0] && parts[1] && parts[1] != "*")
				_str += `${parts[0]}>${(parts[3] == "{" ? "=" : "")}${parts[1]}`;

			if (parts[0] && parts[2] && parts[2] != "*")
				_str = "(" + _str + (_str ? " AND " : "") + `${parts[0]}<${(parts[4] == "}" ? "=" : "")}${parts[2]})`;

			return (openingBrack ? "(" : "") + `${_str.trim()}` + (clossingBrack ? ")" : "");
		});

		return `${str.trim()}`;
	}
	return filter;
}

Array.prototype.searchIndex = function (func) {
	for (var i = 0; i < this.length; i++)
		if (func(this[i]))
			return i;

	return -1;
}

String.prototype.count = Array.prototype.count = function (func) {
	var c = 0;

	for (var i = 0; i < this.length; i++)
		if (func(this[i]))
			c += 1;

	return c;
}

if (!String.prototype.replaceAll) {
	String.prototype.replaceAll = function (str, newStr) {

		// If a regex pattern
		if (Object.prototype.toString.call(str).toLowerCase() === '[object regexp]') {
			return this.replace(str, newStr);
		}

		// If a string
		return this.replace(new RegExp(escapeRegex(str), 'g'), newStr);
	};
}

var operatorSubstitution = { "AND": "&", "OR": "|", "NOT": "!" };
function runSubstitution(expr, substitution, isRecurssion) {
	substitution = Object.assign(substitution || {}, operatorSubstitution);
	var filter = new String(expr || "").toString();

	filter = expandLuceneRange(filter);
	for (var i in operatorSubstitution)
		filter = filter.replaceAll(i, operatorSubstitution[i]);

	var groups = Array.from(filter.matchAll(/(\()([^\(\)]+)(\))/g))?.map(g => g[0])?.distinct();
	if (groups && groups.length) {
		for (var ex of groups) {
			if (ex == expr || ex == filter) continue;
			var f = runSubstitution(ex, substitution, true);
			filter = filter.replaceAll(ex, f);
		}
	}

	var regex = new RegExp("([^" + Object.values(operatorSubstitution).map(v => escapeRegex(v)).join('') + "]+)", "gm");
	var regex2 = /[a-z\u0370-\u03FF]/i;

	var sValues = Object.values(substitution);
	var matches = filter.match(regex)
		?.map(x => x?.trim().trim('()'))
		.filter(x => x && sValues.indexOf(x) < 0)
		.orderByDescending(x => x.length);

	var last = sValues[sValues.length - 1];
	if (last == "!") last = String.fromCharCode(64);

	var i = last.charCodeAt(0);
	if (matches) {
		for (var k of matches) {
			var key = new String(k).toString();
			var char;

			if (!substitution[key]) {
				do {
					char = String.fromCharCode(++i);
					if (i > 9000) //Error exit condition
						return console.error("CAN'T parse expression. depth=" + i);

					if (i == 'Z'.charCodeAt(0) + 1) i = 'a'.charCodeAt(0);
					if (i == 'z'.charCodeAt(0) + 1) i = 'ά'.charCodeAt(0);
					if (i == 'ҁ'.charCodeAt(0) + 1) i = 'Ҋ'.charCodeAt(0);
					if (i == 'ԧ'.charCodeAt(0) + 1) i = 'ؠ'.charCodeAt(0);

					var isGreekOrCoptic = regex2.test(char);
					if (isGreekOrCoptic) break;
				} while (true);

				var keys = Object.keys(substitution);
				var values = Object.values(substitution);

				var keyIndex = keys.indexOf(char.toString());
				var valIndex = values.indexOf(key.toString());

				if (valIndex >= 0) {
					key = keys[valIndex];
					char = values[valIndex];
				} else if (keyIndex >= 0) {
					key = keys[keyIndex]
					char = values[keyIndex];
				} else {
					substitution[key] = char;
				}

				filter = filter.replaceAll(key, substitution[key]);
			}
		}
	}

	var openParenCount = filter.count(x => x == '(');
	var closeParenCount = filter.count(x => x == ')');

	if (openParenCount < closeParenCount)
		filter = '(' + filter;
	else if (openParenCount > closeParenCount)
		filter = filter + ')';

	return filter.replaceAll(' ', '');
}

function toPostfixNotation(infixToken) {
	var outputQueue = [];
	var stack = [];

	var index = 0;
	while (infixToken.length > index) {
		var t = infixToken[index];
		if (isLiteral(t)) {
			outputQueue.push(t);
		} else if (isBinaryOperator(t) || isUnaryOperator(t) || isOpeningParen(t)) {
			stack.push(t);
		} if (isClosingParen(t)) {
			while (stack.length > 0 && stack[stack.length - 1] != "(")
				outputQueue.push(stack.pop());

			stack.pop();

			if (stack.length > 0 && stack[stack.length - 1] == "!")
				outputQueue.unshift(stack.pop());
		}

		++index;
	}

	while (stack.length > 0)
		outputQueue.push(stack.pop());

	return outputQueue.join('')
}

var unaryOperators = ["!"],
	binaryOperator = ["&", "|"],
	isLiteral = (a => /[a-z\u0370-\u03FF]/i.test(a)),
	isOperator = (a => isUnaryOperator(a) || isBinaryOperator(a)),
	isUnaryOperator = (a => unaryOperators.indexOf(a) >= 0),
	isBinaryOperator = (a => binaryOperator.indexOf(a) >= 0),
	isParen = (a => isOpeningParen(a) || isClosingParen(a)),
	isOpeningParen = (a => a == "("),
	isClosingParen = (a => a == ")"),
	stringValueMapping = {
		'null': null,
		'undefined': undefined,
		'true': true,
		'false': false
	};

function substituteBack(expr, substitution) {
	var mapping = {};
	for (var i in substitution) {
		if (!substitution.hasOwnProperty(i)) continue;
		mapping[substitution[i]] = i;
	}

	if (typeof expr == "string")
		expr = expr.split('');

	return expr.map(x => isParen(x) ? x : mapping[x] || `<<<${x}>>>`).join(' ')
}

function postfixToMongo(postfix, substitution) {
	var stack = [];
	var index = 0;

	while (postfix.length > index) {
		var t = postfix[index++];
		if (isOperator(t)) {
			var op = t, left = stack.pop(), right;
			if (isBinaryOperator(op))
				right = stack.pop();

			var mongoOpMap = { "&": "$and", "|": "$or", "!": "$not" };
			var mongoOp = mongoOpMap[op];

			var expr = [left, right].filter(x => x);//.distinctBy(x => JSON.stringify(x));
			if (expr.length == 1 && !isBinaryOperator(op))
				return expr[0];

			var lit = {};
			if (mongoOp) {
				if (["$or", "$and"].indexOf(mongoOp) >= 0) {
					if (left[mongoOp] && Array.isArray(left[mongoOp]))
						lit[mongoOp] = left[mongoOp].concat(right);
					else if (right[mongoOp] && Array.isArray(right[mongoOp]))
						lit[mongoOp] = right[mongoOp].concat(left);
					else
						lit[mongoOp] = expr;
				} else {
					lit[mongoOp] = expr;
				}
			} else
				lit = Object.assign(left || {}, right || {});

			stack.push(lit);
		} else {
			stack.push(evaluateLiteral(t, substitution));
		}
	}


	if (stack.length > 1)
		throw "Error in expression";

	return stack.pop();
}

function evaluateLiteral(lit, substitution) {
	var exprIndex = Object.values(substitution).indexOf(lit);
	if (exprIndex < 0) return lit;

	var value = Object.keys(substitution)[exprIndex];

	var operators = ["NOT", ">=", "<=", "=", ">", "<", ":", "!"];
	var opmapping = ["$not", "$gte", "$lte", "$eq", "$gt", "$lt", "$eq", "$not"];
	var opIndeces = operators.map(o => value.indexOf(o));
	var opIndex = opIndeces.searchIndex(x => x >= 0);
	var opPos = opIndeces.find(x => x >= 0);

	if (opIndex < 0)
		return console.error("Something went wrong!");

	var op = operators[opIndex];
	var opt = opmapping[opIndex];

	var l = opPos != 0 ? value.split('').splice(0, opPos).join('') : null;
	var r = opPos < value.length ? value.split('').splice(opPos + op.length).join('') : null;
	var n;

	if (r) r = r.trim();
	if (l) l = l.trim();

	if (typeof l == "string" && l.contains("*")) l = new RegExp(l.replaceAll(/[\*~]/g, "(.*?)", "i"));
	if (typeof r == "string" && r.contains("*")) r = new RegExp(r.replaceAll(/[\*~]/g, "(.*?)", "i"));

	if (stringValueMapping[r]) r = stringValueMapping[r];
	if (!isNaN(n = parseFloat(r)) && isFinite(r)) r = n;

	let res = {};
	if (l && r) {
		res[l] = {}
		if (opt == "$eq")
			res[l] = r;
		else
			res[l][opt] = r;
	} else if (r) {
		res[opt] = r;
	} else if (l) {
		res[opt] = l;
	} else {
		return console.error("Something went wrong!");
	}

	return res;
}

function luceneToMongo(expr) {
	if (!expr)
		return {};
	if (typeof expr == "object")
		return expr;
	if (/^[a-f0-9]{24}$/.test(expr))
		return { _id: expr }
	if (!/[=:]/.test(expr))
		return { name: new RegExp(`.*?(${expr}).*?`, "i") };

	var substitution = {};
	var tokens = runSubstitution(expr, substitution);
	var postfix = toPostfixNotation(tokens)
	var mango = postfixToMongo(postfix, substitution);

	return mango;
}

function mongoFilterToFn(filter) {
	if (typeof filter == "string") {
		var regex = new RegExp("(" + filter.escapeRegExp() + ")", "ig");
		return (val => !filter || regex.test(JSON.stringify(val)));
	}

	return function (doc) {
		if (!filter) return true;

		var matched = true;
		var val;

		var mathchEval = {
			"$not": () => {
				matched = matched && !mongoFilterToFn(filter[i])(val)
			},
			"$or": () => {
				if (!Array.isArray(filter[i]))
					throw "Expecting an array at " + i;

				matched = matched && Array.from(filter[i]).some(f => mongoFilterToFn(f)(val));
			},
			"$and": () => {
				if (!Array.isArray(filter[i]))
					throw "Expecting an array at " + i;

				matched = matched && Array.from(filter[i]).every(f => mongoFilterToFn(f)(val));
			},
			"$in": () => {
				if (!Array.isArray(filter[i]))
					throw `Expecting an array at '${i}' to evaluate!`;

				matched = matched && Array.from(filter[i]).some(f => mongoFilterToFn(f)(val));
			},
			"$elemMatch": () => {
				if (!val || !Array.isArray(val))
					throw `Expecting an array at '${i}' to evaluate!`;

				matched = matched && Array.from(val).some(v => mongoFilterToFn(filter[i])(v));
			},
			"$gt": () => matched = matched && val > filter[i],
			"$gte": () => matched = matched && val >= filter[i],
			"$lt": () => matched = matched && val < filter[i],
			"$ne": () => {
				if (filter[i] instanceof RegExp)
					matched = matched && !filter[i].test(val);
				else
					matched = matched && val != filter[i];
			},
			"$eq": () => {
				if (filter[i] instanceof RegExp)
					matched = matched && filter[i].test(val);
				else if (filter[i] && filter[i]["$elemMatch"])
					matched = matched && mongoFilterToFn(filter[i])(val);
				else
					matched = matched && val == filter[i];
			}
		};

		for (var i in filter) {
			if (!matched) return matched;

			var parts = i.split(".");

			if (parts.length > 1) {
				for (var j = 0; j < parts.length - 1; j++) {
					if (filter.hasOwnProperty(p)) {
						filter = filter[p];
						i = i.substr(i.indexOf("."));
					}
				}
			}

			var key = Object.keys(doc || {}).find(k => k.toLowerCase().trim() == i.toLowerCase().trim());
			val = doc[key] || doc;

			if (filter.hasOwnProperty(i)) {
				var fn = mathchEval[i] || mathchEval["$eq"];
				if (fn)
					fn();
				else
					console.warn(filter[i]);
			}
		}

		return matched;
	};
}

function luceneToFn(filter) {
	return mongoFilterToFn(luceneToMongo(filter))
}

function orderByExpr(list, orderBy) {
	if (!orderBy) return list;

	var orderByObj = orderByToSortObj(orderBy);
	var ordered = list.slice(0);

	for (var i in orderByObj) {
		if (!orderByObj.hasOwnProperty(i)) continue;

		let orderProperty = i;
		let orderDir = orderByObj[i];

		if (orderDir == -1)
			ordered = ordered.orderByDescending(a => a[orderProperty]);
		else
			ordered = ordered.orderBy(a => a[orderProperty]);
	}

	return ordered;
}

function orderByToSortObj(orderBy) {
	var parts = (orderBy || "").split(' ');
	var sortArray = [];

	for (var i = 0; i < parts.length; i++) {
		if (!parts[i]) continue;

		var last = sortArray.last();

		if (parts[i].toLowerCase() == "desc") {
			if (last) last[Object.keys(last)[0]] = -1
			continue;
		} else if (parts[i].toLowerCase() == "desc") {
			if (last) last[Object.keys(last)[0]] = 1
			continue;
		}

		var sort = {};
		sort[parts[i]] = 1;
		sortArray.push(sort)
	}

	var $sort = {};

	for (var i = 0; i < sortArray.length; i++)
		$sort = Object.assign($sort, sortArray[i]);

	return $sort;
}

async function getPaged(cacheKey, fetchPromise, req, res) {
	var filter = {};

	var page = parseInt(req.query.page || 1);
	var pageSize = parseInt(req.query.pageSize || 20);
	var query = req.query.query || "";
	var ids = req.query.id || req.query.ids || req.body.id || req.body.ids;
	var orderBy = req.query.sort || req.query.sortBy || req.query.order || req.query.orderBy || "modifiedDate DESC";

	if (ids && Array.isArray(ids))
		filter._id = { "$in": ids.map(id => id) };
	else if(typeof ids == "string")
		filter._id = ids;
	else
		filter = luceneToMongo(query);

	var json = { response: "error", message: "", count: 0, data: [] };
	var strQuery = typeof query == "object" ? JSON.stringify(query) : query;

	cacheKey = cacheKey || ("key-" + new Date().getTime());
	console.log(`Running filter on ${cacheKey}: '${strQuery}' Page:${page}, PageSize:${pageSize}`);

	try {
		var list = memCache.get(cacheKey);

		if (!list || !list.length) {
			var fetchedList = await fetchPromise;
			list = fetchedList.map(d => typeof d.toAppObject == "function" ? d.toAppObject() : typeof d.toObject == "function" ? d.toObject() : d);
			memCache.put(cacheKey, list, 10 * 60 * 1000);
		}
		
		list = list.filter(luceneToFn(query));
		list = list.orderByExpr(orderBy);
		list = list.slice((page - 1) * pageSize, page * pageSize);

		if (list && list.length) {
			console.log(`Got ${list.length} ${cacheKey} with query '${strQuery}' Page:${page}, PageSize:${pageSize}.`);
			json.response = "success";
			json.count = list.length;
			json.data = list;
		} else {
			console.log(`Got no ${cacheKey} with query '${strQuery}' Page:${page}, PageSize:${pageSize}`);
			json.response = "success";
			json.message = "No record matching the query";
		}
	} catch (err) {
		if (err) {
			json.message = "Error fetching drinks! " + err;
			console.error(json.message);
		}
	}

	return json;
}

if (!Array.prototype.orderByExpr)
	Array.prototype.orderByExpr = function (orderBy) {
		return orderByExpr(this, orderBy);
	}

//String.prototype.luceneToMongo = function () { return luceneToMongo(this); };

//String.prototype.luceneToFn = function () { return luceneToFn(this); };

module.exports = {
	mongoFilterToFn: mongoFilterToFn,
	orderByExpr: orderByExpr,
	orderByToSortObj: orderByToSortObj,
	luceneToMongo: luceneToMongo,
	luceneToFn: luceneToFn,
	getPaged: getPaged
};