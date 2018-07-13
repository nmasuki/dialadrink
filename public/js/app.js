/**
 * Created by nmasuki on 7/7/2018.
 */
var app = {
	csrf_token: $('meta[name="_csrf"]').attr('content'),

	type: ['', 'info', 'success', 'warning', 'danger'],

	initPickColor: function () {
		$('.pick-class-label').click(function () {
			var new_class = $(this).attr('new-class');
			var old_class = $('#display-buttons').attr('data-class');
			var display_div = $('#display-buttons');
			if (display_div.length) {
				var display_buttons = display_div.find('.btn');
				display_buttons.removeClass(old_class);
				display_buttons.addClass(new_class);
				display_div.attr('data-class', new_class);
			}
		});
	},

	initChartist: function () {

		var dataSales = {
			labels: ['9:00AM', '12:00AM', '3:00PM', '6:00PM', '9:00PM', '12:00PM', '3:00AM', '6:00AM'],
			series: [
				[287, 385, 490, 492, 554, 586, 698, 695, 752, 788, 846, 944],
				[67, 152, 143, 240, 287, 335, 435, 437, 539, 542, 544, 647],
				[23, 113, 67, 108, 190, 239, 307, 308, 439, 410, 410, 509]
			]
		};

		var optionsSales = {
			lineSmooth: false,
			low: 0,
			high: 800,
			showArea: true,
			height: "245px",
			axisX: {
				showGrid: false,
			},
			lineSmooth: Chartist.Interpolation.simple({
				divisor: 3
			}),
			showLine: false,
			showPoint: false,
		};

		var responsiveSales = [
			['screen and (max-width: 640px)', {
				axisX: {
					labelInterpolationFnc: function (value) {
						return value[0];
					}
				}
			}]
		];

		Chartist.Line('#chartHours', dataSales, optionsSales, responsiveSales);


		var data = {
			labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
			series: [
				[542, 443, 320, 780, 553, 453, 326, 434, 568, 610, 756, 895],
				[412, 243, 280, 580, 453, 353, 300, 364, 368, 410, 636, 695]
			]
		};

		var options = {
			seriesBarDistance: 10,
			axisX: {
				showGrid: false
			},
			height: "245px"
		};

		var responsiveOptions = [
			['screen and (max-width: 640px)', {
				seriesBarDistance: 5,
				axisX: {
					labelInterpolationFnc: function (value) {
						return value[0];
					}
				}
			}]
		];

		Chartist.Bar('#chartActivity', data, options, responsiveOptions);

		var dataPreferences = {
			series: [
				[25, 30, 20, 25]
			]
		};

		var optionsPreferences = {
			donut: true,
			donutWidth: 40,
			startAngle: 0,
			total: 100,
			showLabel: false,
			axisX: {
				showGrid: false
			}
		};

		Chartist.Pie('#chartPreferences', dataPreferences, optionsPreferences);

		Chartist.Pie('#chartPreferences', {
			labels: ['62%', '32%', '6%'],
			series: [62, 32, 6]
		});
	},

	initGoogleMaps: function () {
		var myLatlng = new google.maps.LatLng(40.748817, -73.985428);
		var mapOptions = {
			zoom: 13,
			center: myLatlng,
			scrollwheel: false, //we disable de scroll over the map, it is a really annoing when you scroll through page
			styles: [{
				"featureType": "water",
				"stylers": [{"saturation": 43}, {"lightness": -11}, {"hue": "#0088ff"}]
			}, {
				"featureType": "road",
				"elementType": "geometry.fill",
				"stylers": [{"hue": "#ff0000"}, {"saturation": -100}, {"lightness": 99}]
			}, {
				"featureType": "road",
				"elementType": "geometry.stroke",
				"stylers": [{"color": "#808080"}, {"lightness": 54}]
			}, {
				"featureType": "landscape.man_made",
				"elementType": "geometry.fill",
				"stylers": [{"color": "#ece2d9"}]
			}, {
				"featureType": "poi.park",
				"elementType": "geometry.fill",
				"stylers": [{"color": "#ccdca1"}]
			}, {
				"featureType": "road",
				"elementType": "labels.text.fill",
				"stylers": [{"color": "#767676"}]
			}, {
				"featureType": "road",
				"elementType": "labels.text.stroke",
				"stylers": [{"color": "#ffffff"}]
			}, {"featureType": "poi", "stylers": [{"visibility": "off"}]}, {
				"featureType": "landscape.natural",
				"elementType": "geometry.fill",
				"stylers": [{"visibility": "on"}, {"color": "#b8cb93"}]
			}, {"featureType": "poi.park", "stylers": [{"visibility": "on"}]}, {
				"featureType": "poi.sports_complex",
				"stylers": [{"visibility": "on"}]
			}, {"featureType": "poi.medical", "stylers": [{"visibility": "on"}]}, {
				"featureType": "poi.business",
				"stylers": [{"visibility": "simplified"}]
			}]

		}
		var map = new google.maps.Map(document.getElementById("map"), mapOptions);

		var marker = new google.maps.Marker({
			position: myLatlng,
			title: "Hello World!"
		});

		// To add the marker to the map, call setMap();
		marker.setMap(map);
	},

	showLoading: function (msg, timeout) {
		var x, modal = $($('#loading-template').html());
		$(document.body).append(modal);

		modal.on('hidden.bs.modal', function () {
			modal.siblings(".modal-backdrop.in").hide();
			modal.remove();
			if(x) clearTimeout(x);
		});

		modal.find(".lading-msg").html(msg);

		function setModalMaxHeight(element) {
			this.$element     = $(element);
			this.$content     = this.$element.find('.modal-content');
			var borderWidth   = this.$content.outerHeight() - this.$content.innerHeight();
			var dialogMargin  = $(window).width() < 768 ? 20 : 60;
			var contentHeight = $(window).height() - (dialogMargin + borderWidth);
			var headerHeight  = this.$element.find('.modal-header').outerHeight() || 0;
			var footerHeight  = this.$element.find('.modal-footer').outerHeight() || 0;
			var maxHeight     = contentHeight - (headerHeight + footerHeight);

			this.$content.css({
				'overflow': 'hidden'
			});

			this.$element
				.find('.modal-body').css({
				'max-height': maxHeight,
				'overflow-y': 'auto'
			});
		}

		modal.on('show.bs.modal', function() {
			$(this).show();
			setModalMaxHeight(this);
		});

		$(window).resize(function() {
			if ($('.modal.in').length != 0) {
				setModalMaxHeight($('.modal.in'));
			}
		});

		modal.modal({
			keyboard: false,
			backdrop: 'static'
		});

		timeout = timeout || 10000;
		x = setTimeout(function () {
			modal.modal("hide")
		}, timeout, 'hide')

	},

	showModal: function (option) {
		option = option || {};
		var title = option.title || "Dial a Drink";
		var msg = option.msg || option.message;

		var modal = $($('#modal-template').html());
		$(document.body).append(modal);

		if (typeof option.ok == "function")
			modal.find(".btn-primary").on("click", function () {
				option.ok.apply(this, arguments);
			});

		if (typeof option.close == "function")
			modal.find(".btn-secondary, .close").on("click", function () {
				option.close.apply(this, arguments);
			});

		modal.on('hidden.bs.modal', function () {
			$(".modal.loading").modal('hide');
			modal.siblings(".modal-backdrop.in").hide();
			modal.remove();
		});

		modal.find(".modal-body").html(msg);
		modal.modal({
			keyboard: false,
			backdrop: 'static'
		});
	},

	showNotification: function (from, align) {
		var color = Math.floor((Math.random() * 4) + 1);
		$.notify({
			icon: "pe-7s-gift",
			message: "Welcome to <b>Light Bootstrap Dashboard</b> - a beautiful freebie for every web developer."
		}, {
			type: app.type[color],
			timer: 4000,
			placement: {
				from: from,
				align: align
			}
		});
	}
}

if(window.cartUtil)
	app.cartUtil = new window.cartUtil();

/*Handle searching*/
(function ($) {

	$('#search').on('click', function (e) {
		e.preventDefault();

		var query = $('#search_box').val();

		if (query != "") {
			console.log(query)
			window.location.href = "/search/" + query;
		}
	});

	$(".disabled a, a.disabled").on("click", function(e){
        e.preventDefault();
    })
})(jQuery);



