

$(document).ready(function () {
    window.addressData = window.addressData || null;

    $(document).on("load", "#lets-okhi-card iframe", function () {
        console.log(arguments);
    });

    $(document).on("error", "#lets-okhi-card iframe", function () {
        console.error(arguments);
    });

    var loadLocationCard = function (user) {
        var errorTimeOut;
        $('#lets-okhi').hide();

        var handleOnSuccess = function (data) {
            clearTimeout(errorTimeOut);
            window.addressData = data;

            if (window.addressData) {
                app.cartUtil.loadCharges(window.addressData.location);
                app.cartUtil.updateView();
            }

            if (data && data.user && data.location) {
                $('#lets-okhi').hide();

                if (data.user.firstName)
                    $("#firstName").val(data.user.firstName);
                if (data.user.lastName)
                    $("#lastName").val(data.user.lastName);

                $("[name=address]").val(data.location.title);
                $("[name=building]").val(data.location.streetName);
                $("[name=houseNumber]").val([data.location.propertyName, data.location.directions].join(', ').trim().trim(','));
            } else {
                $('#lets-okhi').show();
                $("#lets-okhi-card").hide();
            }

        };

        var handleOnError = function (data) {
            clearTimeout(errorTimeOut);
            window.addressData = null;
            console.warn("Error Implimentation not done!", arguments);

            $('#lets-okhi').animate({ width: 'toggle' }, 350);
            $("#lets-okhi-card").hide();
        };

        user = user || {
            firstName: $("#firstName").val(), // optional
            lastName: $("#lastName").val(), // optional
            phone: $("#phoneNumber").val(), // required
        };

        if (!user.firstName) delete user.firstName;
        if (!user.lastName) delete user.lastName;

        if (user.phone && user.phone.length >= 10) {
            errorTimeOut = setTimeout(function () {
                if (window.addressData) return;
                if ($('#lets-okhi iframe').length) return;

                $('#lets-okhi').hide();
                $("#lets-okhi-card").parent().hide();
                $("#addressInputs").slideDown();

                $(".alert-danger").find(".msg-text").html("<strong>Input Error while detecting your location! Please enter your address</strong>");
                $(".alert-danger").slideDown();
            }, 5000);

            window.addressData = null;
            if (window.locationCard) {
                window.locationCard.user = user;
            } else {
                var element = document.getElementById("lets-okhi-card");
                window.locationCard = new window.okhi.OkHiLocationCard(
                    {
                        user: new window.okhi.OkHiUser(user),
                        style: okhiStyle // optional 
                    },
                    element,
                    function (error, data) {
                        if (error)
                            return handleOnError(error);

                        handleOnSuccess(data);
                    });
            }
        }
    };

    window.loadLocationLookUp = function (user) {
        var errorTimeOut;
        var handleOnSuccess = function (data) {
            clearTimeout(errorTimeOut);
            window.addressData = data;

            $('#lets-okhi').animate({ width: 'toggle' }, 350);
            $("#submitBtn").show();

            $("[name=address]").val(data.location.title);
            $("[name=building]").val(data.location.streetName);
            $("[name=houseNumber]").val([data.location.propertyName, data.location.directions].join(', ').trim().trim(','));

            $("#lets-okhi").parent().show();
            loadLocationCard();
        };

        var handleOnError = function (error) {
            clearTimeout(errorTimeOut);
            window.addressData = null;

            $('#lets-okhi').animate({ width: 'toggle' }, 350);
            $("#addressInputs").slideDown();

            $(".alert-danger").find(".msg-text").html("<strong>Input Error while detecting your location!</strong> " + error);
            $(".alert-danger").slideDown();
        };

        user = user || {
            phone: $("#phoneNumber").val(),
            firstName: $("#firstName").val(),
            lastName: $("#lastName").val(),
        };

        if (user.phone && user.firstName && user.lastName) {
            errorTimeOut = setTimeout(function () {
                window.addressData = null;
                if ($('#lets-okhi iframe').length) return;

                $("#lets-okhi").parent().hide();
                $("#addressInputs").slideDown();

                $(".alert-danger").find(".msg-text").html("<strong>Input Error while detecting your location! Please enter your address</strong>");
                $(".alert-danger").slideDown();
            }, 5000);

            var locationManager = new okhi.OkHiLocationManager({
                user: user,
                config: okhiConfig,
                style: okhiStyle,
                mode: okhi.OkHiLocationManagerLaunchMode.select_location
            });

            locationManager.launch(function (error, data) {
                if (error)
                    return handleOnError(error);

                // handle success data
                handleOnSuccess(data);
            });
        } else {
            $(".alert-danger").find(".msg-text").html("<strong>Input Error!</strong> Invalid input found! Please fill in your <b>names</b> and <b>phone number</b>.")
            $(".alert-danger").slideDown();
        }
    };

    if ($("#phoneNumber").val())
        loadLocationCard();

    $(document).on("change", "#phoneNumber", function (e) {
        loadLocationCard({
            firstName: $("#firstName").val(), // optional
            lastName: $("#lastName").val(), // optional
            phone: $("#phoneNumber").val(), // required
        });
    });

    $(document).on("click", '#lets-okhi', function (e) {
        e.preventDefault();

        var form = $(this).parents("form");
        $(".alert-danger").hide();

        loadLocationLookUp();
    });

});