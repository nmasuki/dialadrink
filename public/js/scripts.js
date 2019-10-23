var touch = false,
    clickEv = 'click';

$.ajaxSetup({
    beforeSend: function (xhr) {
        xhr.setRequestHeader('X-CSRF-Token', $('meta[name="_csrf"]').attr('content'));
    }
});

/*Slider main*/
function slider_main() {
    if ($.fn.carousel)
        $('.carousel').carousel({
            interval: false,
            pause: false
        });
}

/* slider product*/
function slider_product() {
    /* Home1 */
    /* slides block products */
    if ($(".home1_block_product").length) {
        $(".home1_block_product").owlCarousel({
            navigation: true,
            pagination: false,
            autoPlay: false,
            items: 4,
            slideSpeed: 200,
            paginationSpeed: 800,
            rewindSpeed: 1000,
            itemsDesktop: [1199, 3],
            itemsDesktopSmall: [991, 2],
            itemsTablet: [767, 2],
            itemsTabletSmall: [540, 1],
            itemsMobile: [360, 1],
            navigationText: ['<i class="fa fa-angle-left" title="Previous" data-toggle="tooltip" data-placement="top"></i>', '<i class="fa fa-angle-right" title="Next" data-toggle="tooltip" data-placement="top"></i>']
        });
    }
    /* Slider Thumb */
    if ($(".slider-3itemsc").length) {
        $(".slider-3itemsc").owlCarousel({
            navigation: true,
            pagination: false,
            autoPlay: false,
            items: 3,
            slideSpeed: 200,
            paginationSpeed: 800,
            rewindSpeed: 1000,
            itemsDesktop: [1199, 3],
            itemsDesktopSmall: [979, 3],
            itemsTablet: [768, 3],
            itemsTabletSmall: [540, 3],
            itemsMobile: [360, 3],
            navigationText: ['<i class="fa fa-angle-left" title="Previous" data-toggle="tooltip" data-placement="top"></i>', '<i class="fa fa-angle-right" title="Next" data-toggle="tooltip" data-placement="top"></i>']
        });
    }
    /* Slider Relatedpro */
    if ($(".related-products .rp-slider").length) {
        $(".related-products .rp-slider").owlCarousel({
            navigation: true,
            pagination: false,
            items: 4,
            slideSpeed: 200,
            paginationSpeed: 800,
            rewindSpeed: 1000,
            itemsDesktop: [1199, 3],
            itemsDesktopSmall: [991, 3],
            itemsTablet: [767, 2],
            itemsTabletSmall: [540, 2],
            itemsMobile: [480, 1],
            navigationText: ['<i class="fa fa-angle-left" title="Previous" data-toggle="tooltip" data-placement="top"></i>', '<i class="fa fa-angle-right" title="Next" data-toggle="tooltip" data-placement="top"></i>']
        });
    }

    /* Home2 */
    /* slides block products */
    if ($(".home2_product_right").length) {
        $(".home2_product_right").owlCarousel({
            navigation: true,
            pagination: false,
            autoPlay: false,
            items: 3,
            slideSpeed: 200,
            paginationSpeed: 800,
            rewindSpeed: 1000,
            itemsDesktop: [1199, 4],
            itemsDesktopSmall: [991, 3],
            itemsTablet: [767, 3],
            itemsTabletSmall: [600, 2],
            itemsMobile: [420, 1],
            navigationText: ['<i class="fa fa-angle-left" title="Previous" data-toggle="tooltip" data-placement="top"></i>', '<i class="fa fa-angle-right" title="Next" data-toggle="tooltip" data-placement="top"></i>']
        });
    }

    /* Home3 */
    /* slider partners */
    if ($("#home3_partner_content").length) {
        $("#home3_partner_content").owlCarousel({
            navigation: true,
            pagination: false,
            autoPlay: true,
            items: 6,
            slideSpeed: 200,
            paginationSpeed: 800,
            rewindSpeed: 1000,
            itemsDesktop: [1199, 6],
            itemsDesktopSmall: [979, 5],
            itemsTablet: [768, 4],
            itemsTabletSmall: [540, 3],
            itemsMobile: [360, 2],
            navigationText: ['<i class="fa fa-angle-left" title="Previous" data-toggle="tooltip" data-placement="top"></i>', '<i class="fa fa-angle-right" title="Next" data-toggle="tooltip" data-placement="top"></i>']
        });
    }

    /* slides featured products */
    if ($(".home3_featured_product").length) {
        $(".home3_featured_product").owlCarousel({
            navigation: true,
            pagination: false,
            autoPlay: false,
            items: 4,
            slideSpeed: 200,
            paginationSpeed: 800,
            rewindSpeed: 1000,
            itemsDesktop: [1199, 4],
            itemsDesktopSmall: [991, 3],
            itemsTablet: [767, 3],
            itemsTabletSmall: [600, 2],
            itemsMobile: [420, 1],
            navigationText: ['<i class="fa fa-angle-left" title="Previous" data-toggle="tooltip" data-placement="top"></i>', '<i class="fa fa-angle-right" title="Next" data-toggle="tooltip" data-placement="top"></i>']
        });
    }

}

/* Handle dropdown box */
function handleDropdown() {
    if ($('.dropdown-toggle').length) {
        $('.dropdown-toggle').parent().hover(function () {
            if (touch == false && getWidthBrowser() > 767) {
                $(this).find('.dropdown-menu').stop(true, true).slideDown(300);
            }
        }, function () {
            if (touch == false && getWidthBrowser() > 767) {
                $(this).find('.dropdown-menu').hide();
            }
        });

        $('.dropdown-toggle').parent().click(function(e){
            if (touch == false) {
                $(this).find('.dropdown-menu').stop(true, true).slideDown(300);
            }
        })
    }

    $('nav .dropdown-menu').each(function () {
        $(this).find('li').last().addClass('last');
    });


    $('.dropdown').on('click', function () {
        if (touch == false && getWidthBrowser() > 767) {
            var href = $(this).find('a.dropdown-toggle').attr('href');
            if (href)
                window.location = href;
        }
    });

    $('.cart-link').on('click', function () {
        if (touch == false && getWidthBrowser() > 767) {
            var href = $(this).find('.dropdown-link').attr('href');
            window.location = href;
        }
    });
}

/* Function get width browser */
function getWidthBrowser() {
    var myWidth;

    if (typeof (window.innerWidth) == 'number') {
        //Non-IE
        myWidth = window.innerWidth;
        //myHeight = window.innerHeight;
    } else if (document.documentElement && (document.documentElement.clientWidth || document.documentElement.clientHeight)) {
        //IE 6+ in 'standards compliant mode'
        myWidth = document.documentElement.clientWidth;
        //myHeight = document.documentElement.clientHeight;
    } else if (document.body && (document.body.clientWidth || document.body.clientHeight)) {
        //IE 4 compatible
        myWidth = document.body.clientWidth;
        //myHeight = document.body.clientHeight;
    }

    return myWidth;
}

// handle scroll-to-top button
function handleScrollTop() {
    function totop_button(a) {
        var b = $("#scroll-to-top"),
            f = $(".cart-float-right");

        if (a == "on") {
            f.addClass("on fadeInRight ").removeClass("off fadeOutRight");
            b.addClass("on fadeInRight ").removeClass("off fadeOutRight");
        } else {
            f.addClass("off fadeOutRight animated").removeClass("on fadeInRight");
            b.addClass("off fadeOutRight animated").removeClass("on fadeInRight");
        }
    }

    $(window).scroll(function () {
        var b = $(this).scrollTop();
        var c = $(this).height();
        if (b > 0) {
            var d = b + c / 2;
        } else {
            var d = 1;
        }
        if (d < 1e3 && d < c) {
            totop_button("off");
        } else {
            totop_button("on");
        }
    });
    $("#scroll-to-top").click(function (e) {
        e.preventDefault();
        $('body,html').animate({
            scrollTop: 0
        }, 800, 'swing');
    });
}

//newsletter popup
function ModalNewsletter() {

    // if ($.cookie('mello-cookie') != "active"){
    //   $('#newsletter-popup').modal('toggle');
    //   $('.nl-wraper-popup').addClass('animated');
    //    var tnout = 20 ;
    //    setTimeout (function() {
    //      $('#newsletter-popup').modal('hide');
    //    }, tnout*1000 );
    //  }


}

function startDictation() {

    if (window.hasOwnProperty('webkitSpeechRecognition')) {

      var recognition = new webkitSpeechRecognition();

      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.lang = "en-US";
      recognition.start();

      recognition.onresult = function(e) {
        var query = e.results[0][0].transcript;
        recognition.stop();
        
        console.log(query);
        window.location.href = "/search/" + query;
      };

      recognition.onerror = function(e) {
        recognition.stop();
      };

    }
  }

function handleSearchingAndPaging() {
    //{{#if isMobile}}/assets/icon-voice-search.gif{{else}}/assets/icon-search.png{{/if}}
    $('#search_box').on('change', function(){
        if($(this).data("mobile")){
            if($(this).val())
                $("#search").attr("src", "/assets/icon-search.png");
            else
                $("#search").attr("src", "/assets/icon-voice-search.svg");
        }
    });

    $('#search').on('click', function (e) {
        e.preventDefault();
        
        var query = $('#search_box').val();

        if (query) {
            console.log(query);
            window.location.href = "/search/" + query;
        }else{
            startDictation.call(this);
        }
    });

    $(".disabled a, a.disabled").on("click", function (e) {
        e.preventDefault();
    });
}

function handleSearchAutoComplete() {
    if ($.fn.autocomplete)
        $("#search_box").autocomplete({
            source: function (request, response) {
                $.ajax({
                    url: "/search/" + request.term,
                    dataType: "json",
                    data: {
                        term: request.term
                    },
                    success: function (data) {
                        response(data.results);
                    }
                });
            },
            minLength: 2,
            select: function (event, ui) {
                var query = ui.item.value || ui.item;
                if (query !== "") {
                    console.log(query)
                    window.location.href = "/search/" + query;
                }
            }
        });
}

function checkcookie() {
    //$.cookie('mello-cookie', 'deactive', { expires: 10});
}

/* Handle product quantity */
function handleQuantity() {
    if ($('.quantity-wrapper').length) {
        $('.quantity-wrapper').on(clickEv, '.qty-up', function () {
            var $this = $(this);

            var qty = $this.data('src');
            $(qty).val(parseInt($(qty).val()) + 1);
        });
        $('.quantity-wrapper').on(clickEv, '.qty-down', function () {
            var $this = $(this);
            var qty = $this.data('src');

            if (parseInt($(qty).val()) > 1)
                $(qty).val(parseInt($(qty).val()) - 1);
        });
    }
}

function colorwarches() {
    jQuery('.swatch :radio').change(function () {
        var optionIndex = jQuery(this).closest('.swatch').attr('data-option-index');
        var optionValue = jQuery(this).val();
        jQuery(this)
            .closest('form')
            .find('.single-option-selector')
            .eq(optionIndex)
            .val(optionValue)
            .trigger('change');
    });
}

/* Handle Grid - List */
function handleGridList() {

    if ($('#goList').length) {
        $('#goList').on(clickEv, function (e) {
            $(this).parent().find('li').removeClass('active');
            $(this).addClass('active');
            $('.collection-items').addClass('full_width ListMode');
            $('.collection-items').removeClass('no_full_width GridMode');
            $('.collection-items .row-left').addClass('col-md-5');
            $('.collection-items .row-right').addClass('col-md-7');
            $('.collection-items .product-item').removeClass('col-sm-3 col-sm-4');
            $('.grid-mode').addClass("hide");
            $('.list-mode').removeClass("hide");
        });
    }

    if ($('#goGrid').length) {
        $('#goGrid').on(clickEv, function (e) {
            $(this).parent().find('li').removeClass('active');
            $(this).addClass('active');
            $('.collection-items').removeClass('full_width ListMode');
            $('.collection-items').addClass('no_full_width GridMode');
            $('.collection-items .row-left').removeClass('col-md-5');
            $('.collection-items .row-right').removeClass('col-md-7');

            $('.collection-items .product-item').addClass('col-sm-4');

            $('.grid-mode').removeClass("hide");
            $('.list-mode').addClass("hide");
        });
    }
}

function toggleTagsFilter() {
    if (window.innerWidth >= 768) {
        var tagsbutton = document.getElementById('showTagsFilter'),
            tagscontent = document.getElementById('tags-filter-content');
        if (tagsbutton != null) {
            tagsbutton.onclick = function () {
                classie.toggle(this, 'closed');
                classie.toggle(tagscontent, 'tags-closed');
                if (classie.has(this, 'closed'))
                    $('#showTagsFilter').html("Filter <i class='fa fa-angle-down'></i>");
                else $('#showTagsFilter').html("Filter <i class='fa fa-angle-up'></i>");
            };
        }
    }
}

/* Handle Map with GMap */
function handleMap() {
    if (jQuery().gMap) {
        if ($('#contact_map').length) {
            $('#contact_map').gMap({
                zoom: 17,
                scrollwheel: false,
                maptype: 'ROADMAP',
                markers: [{
                    address: '474 Ontario St Toronto, ON M4X 1M7 Canada',
                    html: '_address'
                }]
            });
        }
    }
}

function toggleLeftMenu() {
    if (window.innerWidth <= 767) {
        var menuLeft = document.getElementById('is-mobile-nav-menu'),
            showLeftPush = document.getElementById('showLeftPush'),
            body = document.body;

        showLeftPush.onclick = function () {
            classie.toggle(this, 'active');
            classie.toggle(body, 'pushed');
            classie.toggle(menuLeft, 'leftnavi-open');
            if (classie.has(this, 'active'))
                $('#showLeftPush').html("<i class='fa fa-times fa-2x'></i>");
            else
                $('#showLeftPush').html("<i class='fa fa-bars fa-2x'></i>");
        };
    }
};

/* Function update scroll product thumbs */
function updateScrollThumbsQS() {
    if ($('#gallery_main_qs').length) {

        $('#quick-shop-image .fancybox').on(clickEv, function () {
            var _items = [];
            var _index = 0;
            var product_images = $('#gallery_main_qs .image-thumb');
            product_images.each(function (key, val) {
                _items.push({
                    'href': val.href,
                    'title': val.title
                });
                if ($(this).hasClass('active')) {
                    _index = key;
                }
            });

            $.fancybox(_items, {
                closeBtn: true,
                index: _index,
                helpers: {
                    buttons: {}
                }
            });
            return false;
        });

        $('#quick-shop-image').on(clickEv, '.image-thumb', function () {

            var $this = $(this);
            var background = $('.product-image .main-image .main-image-bg');
            var parent = $this.parents('.product-image-wrapper');
            var src_original = $this.attr('data-image-zoom');
            var src_display = $this.attr('data-image');

            background.show();

            parent.find('.image-thumb').removeClass('active');
            $this.addClass('active');

            parent.find('.main-image').find('img').attr('data-zoom-image', src_original);
            parent.find('.main-image').find('img').attr('src', src_display).load(function () {
                background.hide();
            });

            return false;
        });
    }
}

//Add class in first main section
function addClassFirst() {
    var i = 1;
    var check = 0;
    var show_class = $(".main-content section").first().attr('class');
    if (show_class.indexOf('home3_slideshow') != -1) {
        check = 1;
    }
    $(".main-content section").each(function (index) {
        if (i == 2 && check == 1) {
            if ($(this).attr('class').indexOf('home3_topbanner') != -1) {
                $(this).addClass('padding-80');
                $(".main-content section").first().addClass('padding-80');
            }
        } else if (i == 2 && check == 0) {
            if ($(this).attr('class').indexOf('main-slideshow') == -1) {
                //$(this).addClass('padding-20');
            }
        } else if (i > 2) {
            return false;
        }
        i++;
    });
    /*var show_class = $(".main-content section").first().attr('class');
    if(show_class.indexOf('main-slideshow')==-1){
        $(".main-content section").first().addClass('section_first');
    }*/
}

function handleProductRating() {
    $(document).on("mouseover", ".unrated .glyphicon", function (e) {
        var index = $(this).index();
        for (var i = 0; i <= index; i++)
            $(".unrated .glyphicon").eq(i).css("color", "orange");
    });

    $(document).on("mouseout", ".unrated", function () {
        $(this).find(".glyphicon").css("color", "black");
    });

    $(document).on("click", ".unrated .glyphicon", function (e) {
        var elem = $(this);
        elem.parent().removeClass("unrated").addClass("rated");
        var productId = elem.parents("[data-product]").data("product");
        $.ajax(["/product/rate", productId, parseInt(elem.index()) + 1].join("/"));
    });

    $(document).on("click", ".thumbnail.review-link", function (e) {
        var src = $(this).find("img").attr("src");
        $(this).parents(".row.product-thumbnails")
            .siblings("img.image-responsive")
            .attr("src", src);
    });
}

function loadParticles() {
    var thisSeason = null;
    var seasons = {
        valentines: "14 Feb",
        chrismass: "25 Dec",
    };

    for (var i in seasons) {
        var today = new Date();
        var year = new Date().getFullYear();
        var date = new Date(seasons[i] + " " + year);

        if (today > date.addDays(-7) && today < date.addDays(5)) {
            thisSeason = i;
            break;
        }
    }

    if (thisSeason)
        $.getScript("/js/particles/particles.min.js").then(function () {
            if (window.particlesJS)
                window.particlesJS.load('dad_Body', '/js/particles/data/' + thisSeason + '.json');
        });
}

function ioLazyLoad() {
    var options = {
        root: document.querySelector('.main-content'),
        rootMargin: '0px',
        threshold: 1.0
    };

    function loadImage(imageElement) {
        setTimeout(function () {
            var img = $(imageElement).is("img") ? imageElement : imageElement.querySelector('img');
            img.src = img.dataset.src;
        }, 1000);
    }

    var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            // console.log('entry: ', entry);
            if (entry.intersectionRatio > 0.9) {
                loadImage(entry.target);
                entry.target.classList.add('active');
                // console.log('Loaded: ', entry);
                io.unobserve(entry.target);
            }
        });
    }, options);

    var targetElements = $('img[data-src]');
    targetElements.each(function (i, e) {
        io.observe(e);
    });
}

$(window).resize(function () {
    toggleLeftMenu();
});

function onTouchStart(e) {
    console.log.apply(this, arguments);
}

function handleProductSorting() {

    function getSortFn(property, expectedValue) {
        function getSize(qty){
            if(!qty) return 0;
            qty = qty.toLowerCase();
            var value = qty.replace(/([^\d.]+)/, "").trim() || 0;
            var measure = qty.replace(/([\d.]+)/, "").trim() || "ml";

            if(qty.indexOf(".") >= 0)
                console.log(qty, value, measure);

            if(measure.startsWith("l"))
                return parseFloat(value) * 1000;

            return parseFloat(value);
        }

        return function (elem) {
            var json = $(elem || this).find('script.json').text() || "{}",
                data = JSON.parse(json) || {};

            if (expectedValue) {
                var regex = new RegExp(expectedValue, "i");
                var fValue = data[property] && (data[property].name || data[property] || "");

                if($.isArray(fValue))
                    fValue = fValue.join(",");

                return fValue && regex.test(fValue);
            }

            if (property == 'price' && data.offerPrice)
                return data.offerPrice;
            if(property == 'popularity')
                return -data[property];
            if(property == 'size'){
                if(data.options && data.options.length)
                    return data.options.max(function(o){ return getSize(o.quantity);});
                return 0;
            }
            if(property == 'tags')
                return (data[property] || []).sort()[0];
                            
            return data[property];
        };
    }

    var $grid = $('.products-grid');

    if ($grid.isotope) {
        $grid.isotope({
            getSortData: {
                name: getSortFn('name'),
                popularity: getSortFn('popularity'),
                price: getSortFn('price'),
                size: getSortFn('size'),
            }
        });

        $(".filter").click(function (e) {
            if ($(this).hasClass("active")) {
                $(this).removeClass("active");
                $grid.isotope({filter: "*"});//Remove filter.
            } else {
                var filterBy = ["category", "subCategory", "brand", "tags"];
                var filterByVal = $(this).data("filterby");

                if (filterBy) {
                    $(this).siblings(".active").removeClass("active");
                    $(this).addClass("active");

                    $grid.isotope({
                        filter: function (elem) {
                            elem = elem || this;
                            return filterBy.any(function (f) {
                                return getSortFn(f, filterByVal)(elem);
                            });
                        }
                    });
                }
            }
            if(isMobile)
                $grid.find(".col-sm-12.single").css({"width":"100%"});
        });

        $(".sort-products").click(function (e) {
            $(this).parents(".dropdown-menu").hide();

            var sortBy = $(this).data('sortby') || 'name';
            var sortAscending = !($grid.data('sortedBy') == sortBy && ($grid.data('sortDir') || 'asc') == 'asc');
            var sortDir = (sortAscending ? "asc" : "desc");

            $grid.isotope({
                sortBy: sortBy,
                sortAscending: sortAscending
            });

            $grid.data("sortedBy", sortBy);
            $grid.data("sortDir", (sortAscending ? "asc" : "desc"));
            console.log('Sorting by ' + sortBy + " " + (sortAscending ? "asc" : "desc"));

            function changeSortDirIcon(i, el) {
                var sortIcon = sortDir;
                if(sortBy == "popularity")
                    sortIcon = sortDir == "desc"? "asc": "desc";

                var cls = ($(el).attr("class") || "").replace(/(asc|desc)/, sortIcon);
                if (cls) 
                    $(el).attr("class", cls);
            }

            $(this).find('i.fa').each(changeSortDirIcon);
            $(".sorting, .sorting .fa").each(changeSortDirIcon);
            $(".sorting #sortby").text("Sorted by " + $(this).text());

            if(isMobile)
                $grid.find(".col-sm-12.single").css({"width":"100%"});
        });
        
        /***/
        $grid.data("sortDir", "asc");
        $grid.data("sortedBy", "name");
        $grid.isotope({
            sortBy: 'name',
            sortAscending: true
        });

        if(isMobile)
            $grid.find(".col-sm-12.single").css({"width":"100%"});
        /****/
    } else {
        $(".filter, .sorting").hide();
        console.log("$.fn.isotope not defined. Waiting..");
        setTimeout(handleProductSorting, 500);
    }
}


$(document).ready(function ($) {
    document.addEventListener('touchstart', onTouchStart, {
        passive: true
    });

    if ($.fn.tooltip)
        $('[data-toggle="tooltip"]').tooltip();

    $(document).on("mousemove touchmove", "figure.zoom", function zoom(e) {
        var zoomer = e.currentTarget;
        var offsetX = e.offsetX || (e.originalEvent.changedTouches && e.originalEvent.changedTouches[0].pageX);
        var offsetY = e.offsetY || (e.originalEvent.changedTouches && e.originalEvent.changedTouches[0].pageY);

        x = Math.min(100, Math.max(0, offsetX / zoomer.offsetWidth * 100));
        y = Math.min(100, Math.max(0, offsetY / zoomer.offsetHeight * 100));

        zoomer.style.backgroundPosition = x + '% ' + y + '%';

        e.stopPropagation();
    });

    handleProductSorting();

    loadParticles();

    ioLazyLoad();

    slider_main();

    slider_product();

    handleProductRating();

    handleDropdown();

    handleScrollTop();

    handleSearchingAndPaging();

    handleSearchAutoComplete();

    colorwarches();

    handleQuantity();

    handleGridList();

    toggleTagsFilter();

    handleMap();

    toggleLeftMenu();

    updateScrollThumbsQS();

    addClassFirst();
});

$(window).load(function () {
    //ModalNewsletter();
    //$.cookie('mello-cookie', 'active', { expires: 10});
});