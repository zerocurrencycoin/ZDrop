var satoshi = 100000000;
var DELAY_CAP = 20000;
var lastBlockHeight = 0;

var provider_name = "zerocurrency.io";


var transactionSocketDelay = 1000;

/** @constructor */
function TransactionSocket() {

}

function dump(obj) {
	var out = '';
	for (var i in obj) {
		out += i + ": " + obj[i] + "\n";
	}
   alert(out);
}

TransactionSocket.init = function() {
	// Terminate previous connection, if any
	if (TransactionSocket.connection)
		TransactionSocket.connection.close();

	if ('WebSocket' in window) {		
		var connection = io("insight.zeromachine.io");		
		TransactionSocket.connection = connection;

//* inserted
		eventToListenTo = 'tx';
		room = 'inv';
		   
		connection.on('connect', function() {
		  // Join the room.
		  StatusBox.connected("blockchain");
		  connection.emit('subscribe', room);
		});
		connection.on(eventToListenTo, function(data) {
		  console.log("New transaction received: " + data.txid);
		  console.log("Transaction amount: " + data.valueOut);
		  var bitcoins = data.valueOut;
				new Transaction(bitcoins, true);
		});

// end inserted		*/
		StatusBox.reconnecting("blockchain");
		connection.onopen = function() {
			console.log('zero.cryptonode.cloud1: Connection open!');
			StatusBox.connected("blockchain");
			var newTransactions = {
				"op" : "unconfirmed_sub"
			};
			var newBlocks = {
				"op" : "blocks_sub"
			};
			connection.send(JSON.stringify(newTransactions));
			connection.send(JSON.stringify(newBlocks));
			connection.send(JSON.stringify({
				"op" : "ping_tx"
			}));
			// Display the latest transaction so the user sees something.
		};
		connection.onclose = function() {
			console.log('Bzero.cryptonode.cloud2: Connection closed');
			if ($("#blockchainCheckBox").prop("checked"))
				StatusBox.reconnecting("blockchain");
			else
				StatusBox.closed("blockchain");
		};
		connection.onerror = function(error) {
			console.log('zero.cryptonode.cloud3: Connection Error: ' + error);
		};

		connection.onmessage = function(e) {
			var data = JSON.parse(e.data);
			
			if (data.op == "no_data") {
			    TransactionSocket.close();
			    setTimeout(TransactionSocket.init, transactionSocketDelay);
			    transactionSocketDelay *= 2;
			    console.log("connection borked, reconnecting");
			}

			// New Transaction
		//	if (data.op == "utx") {

			if( data.txid !==undefined){
				var transacted = 0;

				for (var i = 0; i < data.x.out.length; i++) {
					transacted += data.x.out[i].value;
				}

				//var bitcoins = transacted / satoshi;
				var bitcoins = data.valueOut;
				new Transaction(bitcoins, true);
				console.log("Transaction: " + bitcoins + " BTC");

				var donation = false;
                                var soundDonation = false;
				//var outputs = data.x.out;
				//for (var j = 0; j < outputs.length; j++) {
				//	if ((outputs[j].addr) == DONATION_ADDRESS) {
						//bitcoins = data.x.out[j].value / satoshi;
						//new Transaction(bitcoins, true);
						//return;
					//}
				//}

                if (transaction_count === 0) {
                    new Transaction(bitcoins);
                } else {
				    setTimeout(function() {
					    new Transaction(bitcoins);
				    }, Math.random() * DELAY_CAP);
				}

			} else if (data.op == "block") {
				var blockHeight = data.x.height;
				var transactions = data.x.nTx;
				var volumeSent = data.x.estimatedBTCSent;
				var blockSize = data.x.size;
				// Filter out the orphaned blocks.
				if (blockHeight > lastBlockHeight) {
					lastBlockHeight = blockHeight;
					console.log("New Block");
					new Block(blockHeight, transactions, volumeSent, blockSize);
				}
			}

		};
	} else {
		//WebSockets are not supported.
		console.log("No websocket support.");
		StatusBox.nosupport("blockchain");
	}
};

TransactionSocket.close = function() {
	if (TransactionSocket.connection)
		TransactionSocket.connection.close();
	StatusBox.closed("blockchain");
};
