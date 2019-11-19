
    
window.addressData = window.addressData || null;
$(document).ready(function(){    

    var loadLocationCard = function(user){
        $('#lets-okhi').hide();

        var handleOnSuccess = function (data){
            $("[name=address]").val(data.location.title);
            $("[name=building]").val(data.location.streetName);
            $("[name=houseNumber]").val([data.location.propertyName, data.location.directions].join(', ').trim().trim(','));
           
            if(data && data.user && data.location)
                $('#lets-okhi').hide();            
            else{
                $('#lets-okhi').show();
                $("#lets-okhi-card").hide();          
            }

            window.addressData = data;
        };
        
        var handleOnError = function (data){
            console.warn("Eror Implimentation not done!", arguments);
            $('#lets-okhi').show();
            $("#lets-okhi-card").hide();
        };

        user = user || {
            firstName:  $("#firstName").val(), // optional
            lastName: $("#lastName").val(), // optional
            phone: $("#phoneNumber").val(), // required
        };

        if(user.firstName && user.lastName && user.phone && user.phone.length >= 10){
            if( window.locationCard)
                window.locationCard .user = user;
            else{
                var element = document.getElementById("lets-okhi-card");

                window.locationCard = new okhi.LocationCard({
                    element: element, // required
                    user: user, // required
                    onSuccess: handleOnSuccess, // optional
                    onError: handleOnError,// optional
                    style: okhiStyle // optional
                });
            }     
        }      
    };

    var loadLocationLookUp = function(user){
        var handleOnSuccess = function (data) {
            $('#lets-okhi').animate({ width:'toggle' }, 350);
            $("#submitBtn").show();
    
            $("[name=address]").val(data.location.title);
            $("[name=building]").val(data.location.streetName);
            $("[name=houseNumber]").val([data.location.propertyName, data.location.directions].join(', ').trim().trim(','));
            
            $("#addressInputs").slideDown();
            addressData = data;
            
            loadLocationCard();           
        };
    
        var handleOnError = function (error) {
            $('#lets-okhi').animate({width:'toggle'}, 350);
            $("#addressInputs").slideDown();
    
            $(".alert-danger").find(".msg-text").html("<strong>Input Error while detecting your location!</strong> " + error)
            $(".alert-danger").slideDown();
        };
    
        user = user || {
            phone: $("#phoneNumber").val(),
            firstName: $("#firstName").val(),
            lastName: $("#lastName").val(),
        };

        if(user.phone && user.firstName && user.lastName){                
            var locationManager = new okhi.LocationManager({
                user: user,
                onSuccess: handleOnSuccess,
                onError: handleOnError,
                style: okhiStyle
            });

            locationManager.launch({mode: 'select_location'});
        }else{
            $(".alert-danger").find(".msg-text").html("<strong>Input Error!</strong> Invalid input found! Please review your info above.")
            $(".alert-danger").slideDown();
        }
    };

    if($("#phoneNumber").val())
        loadLocationCard();

    $(document).on("change", "#phoneNumber", function(e){
        loadLocationCard({
            firstName:  $("#firstName").val(), // optional
            lastName: $("#lastName").val(), // optional
            phone: $("#phoneNumber").val(), // required
        });
    });

    $(document).on("click", '#lets-okhi', function(e){
        e.preventDefault();
            
        var form = $(this).parents("form");
        $(".alert-danger").hide();

        if (form[0].checkValidity()) {
            loadLocationLookUp();
        } else {
            $(".alert-danger").find(".msg-text").html("<strong>Input Error!</strong> Invalid input found! Please review your info above.");
            $(".alert-danger").slideDown();
        }
    });

});