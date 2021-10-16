# SolarEdge Power node for Node-RED

This is a node for Node-RED to grab data from your SolarEdge inverter. You'll need an API key and your site ID. Talk to your solar PV installer if you need these.
This is a fork of https://github.com/mattjgalloway/node-red-contrib-solaredge

## Installation

In your Node-RED directory:

```
npm install node-red-contrib-solaredge-power
```

## Usage

This package adds 1 input node and 1 configuration node to Node-RED.

The configuration node defines the site and comprises the following options:

  * **Site ID**: The ID of your site.
  * **API Key**: The API key used to talk to the SolarEdge monitoring API. Must be a site API key, not an account users API key.

The input node comprises the following options:

  * **Site**: The SolarEdge site, defined above.
  * **Command**: The command to run against the SolarEdge monitoring API.
  * **Interval**: The interval, in seconds, between calls to the monitoring API.

![Alt text](screenshot.png "Title")

### Commands

The following commands are supported:

  * **Details**: This provides the overview of the system, including information such as the name, status, peak power, etc.
  * **Overview**: This provides data such as the lifetime energy output, current power output, etc.

For more information on the commands, see the [SolarEdge monitoring API documentation](http://www.solaredge.com/sites/default/files/se_monitoring_api.pdf).

## License

MIT
