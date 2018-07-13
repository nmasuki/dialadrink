/**
 * Created by nmasuki on 7/7/2018.
 */
var cartUtil = function () {
	var _cart = {}, _promo = null;
	var _url = "/";

	function getItemView(cartId) {
		var view = self.view().find("[data-cartid='" + cartId + "']");

		if (view.length <= 0) {
			var html = $("#cart-template").html();
			self.view().each(function (i, a) {
				var _html = $(html);
				_html.find("li").data("cartId", cartId);
				$(a).append(_html);
			});
			view = self.view().find("[data-cartid='" + cartId + "']");
		}

		return view;
	}

	function fillIn(cartItem) {
		var priceOption = cartItem.product.priceOptions.find(function (po) {
			return po.option.quantity == cartItem.quantity
		})
		cartItem.image = cartItem.product.image;
		cartItem.currency = priceOption.currency;
		cartItem.price = priceOption.price;
		cartItem._id = cartItem.product._id + "|" + cartItem.quantity;
		return cartItem;
	}

	var self = Object.assign(this, {
		view: function (selector) {
			var view = $('#cart-content-main, #cart-content-mini');
			if (selector)
			{
				return view.find(selector);
            }
			return view;
		},

		init: function () {
			return $.get(_url + "cart/get").then(function (data) {
				_cart = data.cart;
				_promo = data.promo;

				for (var i in _cart)
					_cart[i] = fillIn(_cart[i])

				self.updateView();
			})
		},

		getCart: function () {
			return _cart;
		},

		getCartItem: function (cartItemId) {
			return _cart[cartItemId];
		},

		addItem: function (productId, pieces, qty) {
			var view = self.view('.number');
			qty = qty || "";
			var cartId = productId + "|" + qty;
			var cartItem = _cart[cartId] || (_cart[cartId] = {})

			return $.ajax({
				url: _url + 'cart/add/' + productId + '/' + qty + '/' + (pieces || 1),
				type: 'get',
				success: function (data) {
					console.log(data, pieces);
					_cart[cartId] = fillIn(Object.assign(cartItem, data.item));
					self.updateView();
				}
			});
		},

		updateItem: function (cartId, pieces) {
			var cartItem = _cart[cartId] || (_cart[cartId] = {})

			return $.ajax({
				url: _url + 'cart/update/' + cartId + '/' + pieces,
				type: 'get',
				success: function (data) {
					_cart[cartId] = fillIn(Object.assign(cartItem, data.item));
					self.updateView();
				}
			});
		},

		removeItem: function (cartId) {
			var self = this;
			if (!_cart[cartId]) {
                throw "Cart item not found! " + cartId;
            }

			return $.ajax({
				url: _url + 'cart/remove/' + cartId,
				type: 'get',
				success: function (data) {
					if (data.state) {
						self.view("li[data-cartid='" + cartId + "']").hide();
						delete _cart[cartId];
						self.updateTotals();
					} else {
						console.log("Failed to remove cart item " + cartId, data.msg);
					}
				}
			})
		},

		piecesCount: function () {
			var pieces = 0;

			for (var i in _cart)
				pieces += parseInt(_cart[i].pieces);

			return pieces;
		},

		productCount: function () {
			var productIds = Object.values(_cart)
				.distinct(function (item) {
					return item.product._id;
				});
			return productIds.length;
		},

		totalCost: function () {
			var amount = 0;

			for (var i in _cart)
				amount += _cart[i].pieces * _cart[i].price;

			return amount;
		},

		totalAmount: function () {
			var amount = self.totalCost();
			return amount - self.discount(amount);
		},

		discount: function (amount, promo) {
			amount = amount || self.totalCost();
			promo = promo || _promo;

			if (promo && promo.discountType) {
				return Math.round(promo.discountType == "percent" ? amount * promo.discount / 100 : promo.discount);
			} else {
				return 0;
			}
		},

		updateView: function (cart, promo) {
			cart = cart || _cart;
			promo = promo || _promo;

			//Update changes
			Object.values(cart).forEach(self.updateCartItemView);
			//Remove missing
			Object.keys(_cart).forEach(function (cartId) {
				if (!cart[cartId])
                {
                    self.view("li[data-cartid='" + cartId + "']").hide();
                }
			});

			var promoView = $(".promo-code-wrapper").slideDown();
			if (promo && promo.discountType && self.discount(null, promo)) {
				promoView.find(".promo-code").text(promo.code)
				promoView.find(".promo-code-amount").text(self.discount(null, promo).formatNumber(2))
			} else {
				promoView.hide()
			}

			//Update variable
			_cart = cart;
			_promo = promo;
			self.updateTotals();
		},

		updateCartItemView: function (item) {
			if (typeof item == "string")
            {
                item = self.getCartItem(item);
            }

			if (!item)
            {
                throw "Missing [item] when updating cart item view";
            }

			if (!item._id)
            {
                throw "Missing [item._id] when updating cart item view";
            }

			// item = fillIn(item);

			var view = getItemView(item._id);
			view.find(".cart-image").attr("src", item.product.image.secure_url);
			view.find(".cart-product-link")
				.attr("href", item.product.href)
				.html(item.product.name + " " + item.quantity);
			view.find(".cart-description").html((item.description || "").truncate(50));
			view.find(".cart-pieces").html(item.pieces);

			var priceOption = item.product.priceOptions.find(function (po) {
				return po.option.quantity == item.quantity
			});

			view.find(".cart-currency").html(priceOption.currency || "KES");
			view.find(".cart-price").html((item.pieces * priceOption.price).formatNumber(2));
		},

		updateTotals: function () {
			$(".cart-total-products").html(self.productCount());
			$(".cart-total-pieces").html(self.piecesCount());
			var totalHtml = self.totalAmount().formatNumber(2);

			if (self.totalAmount() != self.totalCost())
				totalHtml = "<span style='font-size: 0.8em; text-decoration: line-through; color: orangered'>{0}</span>"
					.format(self.totalCost().formatNumber(2)) + totalHtml;

			$(".cart-total").html(totalHtml);
		}
	});

	self.init();
	return self;
};

window.app = window.app || {cartUtil: new cartUtil()};

$(function () {
	$(document).on('click', '.add-to-cart', function (e) {
		e.preventDefault();
		var id = $(this).data('product');
		var qty = $(this).data('qty');

		if (id) {
			console.log('The id is this after changes', id);
			var view = $(this).parents("#product-section").find(".pieces");
			var pieces = parseInt(view.val()) || 1;

			app.cartUtil.addItem(id, pieces, qty);
		} else {
			console.warn("Could not add to cart, [data-product] attribute missing on", $(this))
		}
	});

	$(document).on('change', '.cart-pieces', function (e) {
		e.preventDefault();
		var pieces = $(this).val();
		var cartId = $(this).parents("[data-cartid]").data('cartid');
		app.cartUtil.updateItem(cartId, pieces);
	});

	$(document).on('click', '.cart-remove', function (e) {
		e.preventDefault();
		var cartId = $(this).parents("[data-cartid]").data('cartid');
		app.cartUtil.removeItem(cartId);
	});

	$(document).on("click", ".pieces-minus", function () {
		var view = $(this).siblings(".pieces");
		var pieces = parseInt(view.val()) || 1;
		view.val(--pieces);

		var cartId = $(this).parents("[data-cartid]").data("cartid");
		if (cartId) {
			app.cartUtil.updateItem(cartId, pieces);
		} else {
			console.warn("Could not get cart id!!")
		}
	})

	$(document).on("click", ".pieces-plus", function () {
		var view = $(this).siblings(".pieces");
		var pieces = parseInt(view.val()) || 1;
		view.val(++pieces);

		var cartId = $(this).parents("[data-cartid]").data("cartid");
		if (cartId) {
			app.cartUtil.updateItem(cartId, pieces);
		} else {
			console.warn("Could not get cart id!!")
		}
	})

	$(document).on('change', '#change-quantity', function (e) {
		e.preventDefault();

		var quantityId = $(this).find(':selected').data('option');
		console.log(quantityId);

		$('#product-data').attr('data-product', quantityId);

		var price_ = $(this).val();
		$('#product-price').html(price_);

		var opt = $(this).find(':selected').text().trim();
		$(".add-to-cart").data("qty", opt);
	})

	$(document).on('click', '#checkout-form', function (e) {
		e.preventDefault();
		var name = $('#name').val(),
			cell = $('#phone').val(),
			location = $('#location').val(),
			street = $('#street').val(),
			building = $('#building').val(),
			houseno = $('#houseno').val(),
			_csrf = $('#_csrf').val(),
			email = $("#email").val();

		// var btn = $('check-out');

		if (name != "" && cell != "" && location != "" && email != "") {
			data = {
				street: street,
				building: building,
				houseno: houseno,
				name: name,
				cell: cell,
				location: location,
				email: email,
				_csrf: _csrf
			}
			console.log(data)

			$.ajax({
				headers: {'X-CSRF-Token': csrf_token},
				type: 'get',
				url: '/cart/checkout/' + name + "/" + location + "/" + cell + "/" + email + "/" + street + "/" + building + "/" + houseno,
				data: data,
				success: function (data) {
					console.log(data)
					if (data.state) {
						window.location.href = "/order-placed";
					}
				},//seccuss ajax
				error: function (XMLHttpRequest, textStatus, errorThrown) {
					console.log(XMLHttpRequest, textStatus, errorThrown)
				}
			})
		}//checkout if the form is filled
		else {
			var msg = "Please fill all the fields and try again";
			$('.checkout-error').html(msg);
		}
	})//checkout event

})
