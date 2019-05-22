var rateboxTimeout;
var currentExchange;
var ratebox_ms = 3000; // 3 second update interval
var globalRate = -1; // set upon first rate received
var globalRateZerToBtc = -1; // set upon first rate received

function setGlobalRate(rate,cur,accu) {
    if (globalRate === -1) {
        var checkbox = $("#showDollarCheckBox");
        checkbox.prop("disabled", false);
        checkbox.parent().removeClass("disabled");
    }
    $("#rate_"+cur).html(parseFloat(rate).toFixed(accu));
    globalRate = rate;
    zerocalc();    
}

rateboxGetRate = function() {
	$.getJSON("https://blockchain.info/ticker?cors=true", function(data) {
        setGlobalRate(data.USD.last,'btc',2);
    });
    $.getJSON('https://api.crex24.com/CryptoExchangeService/BotPublic/ReturnTicker?request=[NamePairs=BTC_ZER]', function(data) {
        setGlobalRate(data.Data.LastPrice,'zero',8);
        globalRateZerToBtc = data.Data.LastPrice;
    }); 
       
};

$(document).ready(function() {    
    $.ajaxSetup ({  
        cache: false  
    });  

    //cryptopia API query 
    setInterval(function(){
        $.getJSON('https://api.crex24.com/CryptoExchangeService/BotPublic/ReturnTicker?request=[NamePairs=BTC_ZER]', function(data) {
            setGlobalRate(data.Data.LastPrice,'zero','8');
            globalRateZerToBtc = data.Data.LastPrice;
            if (rateboxTimeout) clearTimeout(rateboxTimeout);
        });
    }, 60000);
    
	// Bitstamp websocket API
    var pusher = new Pusher('de504dc5763aeef9ff52');
    var channel = pusher.subscribe('live_trades');
    channel.bind('trade', function(ticker) {
        setGlobalRate(ticker.price,'btc','2');
        if (rateboxTimeout) clearTimeout(rateboxTimeout);
    });   
});

switchExchange = function(exchangeName) {
	clearTimeout(rateboxTimeout);
	currentExchange = exchangeName;
	$("#rate_btc, #rate_zero").html("---");
	
	if (exchangeName == "bitstamp") {
		$("#bitstampRate").css("color", "white");
		$("#mtgoxRate").css("color", "gray");
	} else if (exchangeName == "mtgox") {
		$("#mtgoxRate").css("color", "white");
		$("#bitstampRate").css("color", "gray");
	}
	
	rateboxGetRate();
};
