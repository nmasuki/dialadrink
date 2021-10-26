/**
 * Created by nmasuki on 7/7/2018.
 */
$.fn.startCountDown = function(countDownDate){
	var that = $(this);
	if(!countDownDate){
		var today = new Date(new Date().toISOString().substr(0, 10));
		var oneDay = 1000 * 60 * 60 * 24;

		// Set the date we're counting down to
		countDownDate = new Date(today.getTime() + oneDay).getTime();
	}
	
	var interval = setInterval(function () {

		// Get todays date and time
		var now = new Date().getTime();

		// Find the distance between now an the count down date
		var distance = countDownDate - now;

		// Time calculations for days, hours, minutes and seconds
		var days = Math.floor(distance / (1000 * 60 * 60 * 24));
		var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
		var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
		var seconds = Math.floor((distance % (1000 * 60)) / 1000);

		var time = "";
		if (days > 0) 
			time += days + "d ";
		
		time += hours.toString().padStart(2, "0") + ":" +
			minutes.toString().padStart(2, "0") + ":" +
			seconds.toString().padStart(2, "0");

		// If the count down is finished, write some text
		if (distance < 0) {
			clearInterval(interval);

			that.parent().hide();
			that.addClass("countDownTimer").html("");
		} else {
			that.parent().show();
			that.addClass("countDownTimer").html(time);
		}
	}, 1000);

	that.data("interval", interval);
}

$.fn.stopCountDown = function(){
	var interval = $(this).data("interval");
	if(interval)
		clearInterval(interval);
}

