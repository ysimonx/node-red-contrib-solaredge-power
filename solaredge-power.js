var https = require('https'),
    urllib = require("url"),
    EventEmitter = require('events').EventEmitter;

function dateFormat (date, fstr, utc) {
  utc = utc ? 'getUTC' : 'get';
  return fstr.replace (/%[YmdHMS]/g, function (m) {
    switch (m) {
    case '%Y': return date[utc + 'FullYear'] (); // no leading zeros required
    case '%m': m = 1 + date[utc + 'Month'] (); break;
    case '%d': m = date[utc + 'Date'] (); break;
    case '%H': m = date[utc + 'Hours'] (); break;
    case '%M': m = date[utc + 'Minutes'] (); break;
    case '%S': m = date[utc + 'Seconds'] (); break;
    default: return m.slice (1); // unknown code, remove %
    }
    // add leading zero if required
    return ('0' + m).slice (-2);
  });
}



module.exports = function(RED) {

    var API_BASE = "https://monitoringapi.solaredge.com";

    function SolarEdgeSite(n) {
        RED.nodes.createNode(this, n);

        this.siteid = n.siteid;
        this.apikey = n.apikey;
    }

    RED.nodes.registerType("solaredge-power-site", SolarEdgeSite);

    function SolarEdgeNode(n) {
        RED.nodes.createNode(this, n);

        var node = this;
        node.site = RED.nodes.getNode(n.site);
        node.interval = n.interval;
        node.command = n.command;
        node.timer = {};
        
        function generateURL(command, options) {
            var query = "";
            for (var key in options) {
                query += encodeURIComponent(key) + "=" + encodeURIComponent(options[key]);
            }

            var prefix_url = ""
            switch (command) {

                case 'list':
                case 'sensors':
                    prefix_url = "/equipment/" + node.site.siteid + "/" + command + ".json" ;
                    break;

                case 'details':
                case 'overview':
                case 'currentPowerFlow':
                case 'inventory':
                case 'dataPeriod':
                case 'envBenefits':
		    prefix_url = "/site/" + node.site.siteid + "/" + command + ".json" ;
                    break;

	
                case 'inverterTechnicalData':
                    prefix_url = "/site/" + node.site.siteid + "/" + "inventory" + ".json" ;
                    break;

                default:
                    prefix_url = "/site/" + node.site.siteid + "/" + command + ".json";
              }


            return API_BASE + prefix_url + "?" + query;
            // return API_BASE + "/site/" + node.site.siteid + "/" + command + ".json" + "?" + query;
        }
        
        function fetchData2nd(node, msg) {
		date5minutesAgo = new Date ();
		date5minutesAgo.setMinutes(date5minutesAgo.getMinutes() -5);
           var options = { api_key: node.site.apikey,
				endTime: dateFormat(new Date (), "%Y-%m-%d %H:%M:%S", true),
				startTime: dateFormat(date5minutesAgo, "%Y-%m-%d %H:%M:%S", true)
			 };
           var query="";
            for (var key in options) {
                query += "&" + encodeURIComponent(key) + "=" + encodeURIComponent(options[key]);
            }
		// console.log(Date());

	    var SN = msg.payload.Inventory.inverters[0].SN;
	    
            newurl = API_BASE + "/equipment/" + node.site.siteid + "/" + SN + "/data?a=1" + query;
            msg.newnurl = newurl;
            // console.log(newurl);

 	    var opts = urllib.parse(newurl);
            opts.method = "GET";

            var request = https.request(opts, function(res) {
                res.setEncoding('utf8');

                var msg = {};
                msg.statusCode = res.statusCode;
                msg.payload = "";

                res.on("data", function(chunk) {
                    msg.payload += chunk;
                    node.log(chunk);
                });

                res.on("end",function() {
                    try { msg.payload = JSON.parse(msg.payload); }
                    catch(e) { node.warn("Invalid JSON returned"); }
		            // console.log("youhou");
                    node.send(msg);
                    node.status({});
                });
            });

            request.on("error", function(err) {
                node.error(err);
                node.status({ fill: "red", shape: "dot", text: "error" });
            });

            request.end();
        }


        function fetchData() {
            node.timer = setTimeout(fetchData, node.interval * 1000);

            var options = { api_key: node.site.apikey };
            var url = generateURL(node.command, options);

            var opts = urllib.parse(url);
            opts.method = "GET";

            var request = https.request(opts, function(res) {
                res.setEncoding('utf8');

                var msg = {};
                msg.statusCode = res.statusCode;
                msg.payload = "";

                res.on("data", function(chunk) {
                    msg.payload += chunk;
                    node.log(chunk);
                });

                res.on("end",function() {
                    try { msg.payload = JSON.parse(msg.payload); }
                    catch(e) { node.warn("Invalid JSON returned"); }
                    switch (node.command) {
                        case 'inverterTechnicalData':
                            fetchData2nd(node, msg);
                            break;
                        
                        default:
                            node.send(msg);
                            node.status({});
                            break;
                    }
                });
            });

            request.on("error", function(err) {
                node.error(err);
                node.status({ fill: "red", shape: "dot", text: "error" });
            });

            request.end();
        }

        node.on("close", function(){
            if (node.timer) {
                clearTimeout(node.timer);
            }
        });

        fetchData();
    }

    RED.nodes.registerType("solaredge-power", SolarEdgeNode);

};