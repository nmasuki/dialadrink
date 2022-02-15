

$(document).ready(function () {
    window.addressData = window.addressData || null;

    $(document).on("load", "#lets-okhi iframe", function () {
        console.log(arguments);
    });

    $(document).on("error", "#lets-okhi iframe", function () {
        console.error(arguments);
    });

    window.loadLocationCard = function(user){
        var errorTimeOut;
        $(".alert-danger").hide();
        
        var handleOnSuccess = function (data) {
            $(".alert-danger").hide();
            clearTimeout(errorTimeOut);
            
            data = {
                user: user,
                location: Object.assign(data.geo_point,{
                    id: data.id,
                    title: data.display_title,
                    subtitle: data.subtitle,
                    streetName: data.street_name,
                    propertyName: data.property_name,
                    directions: data.directions,
                    otherInformation: data.other_information 
                }),
                url: data.url,
                userId: data.user_id,
                plus_code: data.plus_code,
                id: data.id,
            }

            window.addressData = data;

            if (window.addressData) {
                app.cartUtil.loadCharges(window.addressData.location);
                app.cartUtil.updateView();
            }

            if (data && data.user && data.location) {
                if (data.user.firstName)
                    $("#firstName").val(data.user.firstName);
                if (data.user.lastName)
                    $("#lastName").val(data.user.lastName);

                $("[name=address]").val(data.location.title);
                $("[name=building]").val(data.location.streetName);

                var otherInformation = [data.location.propertyName, data.location.directions, data.location.otherInformation].filter(function(x){ return !!x;}).join(', ').trim().trim(',');
                $("[name=houseNumber]").val(otherInformation);
            }
        };

        var handleOnError = function (data) {
            clearTimeout(errorTimeOut);
            window.addressData = null;

            if(data.code == "invalid_phone"){
                if(user.phone){
                    $(".alert-danger").find(".msg-text").html("<strong>" + data.message + "</strong>");
                    $(".alert-danger").slideDown();
                }
                return;
            } 
            

            if(data.code){
                $(".alert-danger").find(".msg-text").html("<strong>" + data.message + " while getting user location!</strong>");
                $(".alert-danger").slideDown();
            }
        };
        
        user = user || window.addressData?.user || {
            phone: $("#phoneNumber").val() || "", // required
            firstName: $("#firstName").val(), // optional
            lastName: $("#lastName").val(), // optional
        };

        if(user.phone)
            user.phone = "+" + user.phone.cleanPhoneNumber();

        if(!window.okhiCollection){
            window.okhiCollection = new okcollect({
                target: document.querySelector('#lets-okhi'),
                props: {
                    API_KEY: window.okhiData.clientKey,
                    userFirstName: user.firstName || "",
                    userLastName: user.lastName || "",
                    userPhoneNumber: user.phone || "",
                    onAddressSelected: (userAddress) => {
                        handleOnSuccess(userAddress)
                    },
                    onError: (error) => {
                        handleOnError(error)
                    },
                    streetviewEnabled: true,
                    toTheDoorEnabled: true,
                    styleSettings: window.okhiData.style,
                    appSettings: {
                        name: window.okhiData.appName,
                        version: window.okhiData.appVersion
                    },
                }
            });

            document.querySelector('#phoneNumber').addEventListener('input', (ev) => {
                if(ev.target.value)
                    window.okhiCollection.$set({ userPhoneNumber: "+" + ev.target.value.cleanPhoneNumber() });
            });

            document.querySelector('#firstName').addEventListener('input', (ev) => {
                window.okhiCollection.$set({ userFirstName: ev.target.value });
            });
            
            document.querySelector('#lastName').addEventListener('input', (ev) => {
                window.okhiCollection.$set({ userLastName: ev.target.value });
            });                

            //Timeout
            $("#lets-okhi").parent().show();                    
            if (user.phone && user.phone.length >= 10) {
                errorTimeOut = setTimeout(function () {
                    if (window.addressData) return;
                    if ($('#lets-okhi').html()) return;

                    $("#lets-okhi").parent().hide();
                    $("#addressInputs").slideDown();

                    $(".alert-danger").find(".msg-text").html("<strong>Input Error while detecting your location! Please enter your address</strong>");
                    $(".alert-danger").slideDown();
                }, 5000);
            }
            
        } else{
            window.okhiCollection.$set({ 
                userPhoneNumber: user.phone,
                userFirstName: user.firstName,
                userLastName: user.lastName 
            });
        }
    }

    window.loadLocationLookUp = function (user) {
        window.loadLocationCard(user);
    };

    $(document).on("click", '#lets-okhi button', function (e) {
        if(!window.addressData){
            e.preventDefault();

            var form = $(this).parents("form");
            $(".alert-danger").hide();

            loadLocationLookUp();
        }
    });
});