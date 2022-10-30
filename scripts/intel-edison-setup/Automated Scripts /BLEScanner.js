const Noble = require("noble")
const BeaconScanner = require("node-beacon-scanner")

var scanner = new BeaconScanner();
var count = 0;
var arr = [];
var sum, avg, dist, flag = 0;
var devices = ["984fee03a56d", "984fee03a54b"];
var distances = [3.5,2.8];
var curr_device = "";
var index_curr_device = 0;
var include_id, include_curr = 0;
var i;
scanner.onadvertisement = (advertisement) => {
	var beacon = advertisement["iBeacon"];
	beacon.rssi = advertisement["rssi"];
	beacon.id = advertisement["id"];
	//console.log(beacon.id)
	if(flag == 0) {
		for (i = 0; i < devices.length; i++) {
			if (beacon.id == devices[i]) {
				include_id = 1;
				curr_device = beacon.id;
			}
		}
		if(include_id == 1) {
			flag = 1;
			console.log("Found device %s", curr_device)
			//count = count + 1;
			//console.log(count);
		}
	}
	//if(include_id == 1){
	//	count = count + 1;
		//console.log(count);
	//}
	if(beacon.id == curr_device) {
		arr.push(beacon.rssi);
		count = count + 1;
		console.log(count)
	}
	//console.log(beacon.id)
	//sum = sum + beacon.rssi
	//console.log(sum)
	if(count == 20) {
		scanner.stopScan();
		//console.log(arr);
		sum = arr.reduce(function(a,b) { return a+b; });
		avg = sum / arr.length;
		index_curr_device = devices.indexOf(curr_device);
		dist = distances[index_curr_device];
		devices.splice(index_curr_device, 1);
		console.log("Calibrated RSSI is %d at %d m", avg,dist);
		
		curr_device = "";
		count = 0;
		arr = [];
		sum = 0;
		avg = 0;
		flag = 0;
		include_id = 0;
		scanner.startScan();
	}
};

scanner.startScan().then(() => {
	console.log("Scanning for BLE devices...");
}).catch((error) => {
	console.error(error);
});

