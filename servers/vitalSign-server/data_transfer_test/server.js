var zmq        	= require('zmq');
var h  			= require('highland')
var fs 			= require('fs');

var nodeDataServerPull = zmq.socket('pull');
nodeDataServerPull.setsockopt(zmq.ZMQ_SNDHWM, 2000);
nodeDataServerPull.bind('tcp://137.132.165.161:5566');

var parseJSON = function (obj) {
  var e, error;
  try {
    return JSON.parse(obj);
  } catch (error) {
    e = error;
    return null;
  }
}

var dataReceived = function(dataType, dataAx, dataAy, dataAz, dataTime){
  this.type = dataType,
  this.ax = dataAx,
  this.ay = dataAy,
  this.az = dataAz,
  this.time = dataTime
}

function toInt16(x) {
  if(x >= Math.pow(2,15)) {
    return x - Math.pow(2,16)
  } else {
    return x;
  }
}

function covertToCSVformat(dataList){
  var csvData="Start:"+ ',' + timeStart + ',' + "End:" + ',' + timeEnd +"\n"+ "type,ax,ay,az,timestamp\n";
  for(var i=0;i<dataList.length; i++){
    csvData += dataList[i].type+','+ dataList[i].ax +','+ dataList[i].ay + ','+ dataList[i].az +','+ dataList[i].time + '\n'
  }
  return csvData
}

var timeStart = Date.now();
var timeEnd = timeStart+(5*60*1000);

console.log("Start timestamp: " + timeStart + "\nEnd timeStamp: " + timeEnd)


nodeDataStream = h('message', nodeDataServerPull)

var device_type, gatt, characteristic, data=[];

var dataList = [];

nodeDataStream
.map(parseJSON)
.compact()
.each(function(arg1) {
	// console.log(arg1.gatt)
	gatt= arg1.gatt
	service = gatt.service
	characteristic = gatt.characteristic
	data = new Buffer(arg1.data.data);
	if (service === 'fff0' && characteristic === 'fff1') {
      device_type = 'homerehab';
    } else {
      device_type = 'RHYTHM+';
    }

    switch (device_type) {
	    case 'homerehab': //HomeRehabSensor's data
		    var ts0, ts1, ts2, ts3, ts4, ts5, timestamp, ax, ay, az;
		    ts0 = data[2] & 0x0f;
		    ts1 = data[4] & 0x0f;
		    ts2 = data[6] & 0x0f;
		    ts3 = (data[8] & 0xf0) >> 4;
		    ts4 = (data[10] & 0xf0) >> 4;
		    ts5 = (data[12] & 0xf0) >> 4;
		    timestamp = ts0 | (ts1<<4) | (ts2 <<8) | (ts3 << 12) | (ts4 << 16) | (ts5 << 20);
		    // console.log(now + ' ' + node);  //the unix timstamp according to the system.
		    ax = (data[2] & 0xf0) | (data[3] << 8);
		    ay = (data[4] & 0xf0) | (data[5] << 8);
		    az = (data[6] & 0xf0) | (data[7] << 8);
		    //Convert to signed 16-bit integer
		    var accx = toInt16(ax);
		    var accy = toInt16(ay);
	    	var accz = toInt16(az);

	    	dataList.push(new dataReceived(device_type,ax,ay,az,timestamp))
	    	console.log(device_type+','+ ax +','+ ay + ','+ az +','+ timestamp + '\n')
	    	// console.log(timestamp)
     		break;
    	case 'RHYTHM+': //RHYTHM+ HR Sensor's data
	    	var hr = data;
		    var HRMEasurement = hr[1];
		    HRMEasurement = toInt16(HRMEasurement);
		      // console.log('Heart Rate: ' + HRMEasurement + '\t' + now + ' ' + 'node' + node);  //the unix timstamp according to the system.);
		    break;
	    default: //nothing
	        break;
  	}
  	if(Date.now()>timeEnd){
	    console.log("Process Completed")

	    var timeDiff = timeEnd - timeStart
	    var totalPack = timeDiff/20
	    var receivedPack = dataList.length
	    var lostPack = totalPack-receivedPack
	    var efficiency = receivedPack/totalPack * 100

	    console.log("Package Lost: " + lostPack + "\t" + "Efficiency: " + efficiency)

	    var dataString = covertToCSVformat(dataList)
	    // console.log(dataString)
	  	fs.writeFile("data.csv",dataString, function(err) {
	        if(err) {
	            return console.log(err);
	        }
	        console.log("The file was saved!");
	        process.exit(1)
	   	}); 
	}
})


