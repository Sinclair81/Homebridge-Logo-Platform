# 1.4.6 #

## Add Watchdog ##

Add Watchdog as fix for issue #44.</br>

# 1.4.5 #

## Changes in Blind and Window ##

The return value of Position State is now correct.</br>
In conjunction with the newly revised UDFs Blind v4, v4A, v4B or v5,</br>
the correct values ​​for Target Position and Position State</br>
should now always be returned at all times.</br>

## Garage Door Opener ##

The UDF is now in version 2.</br>
The Target Door State output now also changes value when</br>
the door is opened via a button on the LOGO!</br>

## Error handling ##

All errors caused by incorrect IP address or incorrect port number are now always displayed.</br>

# 1.4.4 #

## ready for Homebridge v2.0 ##

# 1.4.3 #

## Added multi accessory ##

## Brightness of Lightbulb is now optional ##

# 1.4.2 #

## FIX for Issue #36 "Verbindungsproblem mit vw variablen" ##

# 1.4.1 #

## Added logging capability to Eve App to several sensor and accessories ##

Accessorys: switch, lightbulb, outlet, thermostat</br>  
Sensors: motion, contact, CO2, humidity</br>  
More information about this in the README on GitHub.</br>  

# 1.4.0 #

## Change from node-snap7 to napi-snap7 ##

To ensure compatibility with Node.js 18.x and 20.x.

# 1.3.8 #

## Adding logging of all values to an InfluxDB ##

And as a test, log a temperature using Fakegato in the Eve app.</br>  
More information about this in the README on GitHub.</br>  

# 1.3.7 #  

Added logging for all accessories and sensors.</br>  
For [Homebridge-Logging](https://github.com/Sinclair81/Homebridge-Logging) or any other freely configurable udp server for logging.</br>  

# 1.3.6 #  

Integrated valve as sub-accessory of IrrigationSystem.</br>  
Fix pushButton in all Accessories.</br>  

# 1.3.5 #  

Hotfix for no Snap7 in Node.js versions 19.x and 20.x!</br>  

# 1.3.4 #  

Add Outlet Accessory.</br>  

# 1.3.3 #  

Bugfix to avoid memory leak.</br>  

# 1.3.2 #  

Reading of negative numbers and error handling improved, in Modbus and Snap7.</br>  

# 1.3.1 #  

Removed unnecessary debug messages.</br>  

# 1.3.0 #  

## Snap7 Support ##  

From now on, the S7 protocol via Snap7 is also supported in this plug-in.</br>  

# 1.2.0 #  

## Improvements in Garagedoor Accessory ##  

Add functionality to read digital state values for CurrentDoorState and TargetDoorState.</br>
The digital status for open and closed is on purpose reversed.</br>
Analog - 0 = Open; 1 = Closed; 2 = Opening; 3 = Closing; 4 = Stopped;</br>
Digital - 0 = Closed; 1 = Open;</br>

# 1.1.3 #  

## Performance improvements in Blind, Window and Garagedoor ##

Check whether two logo addresses are the same for different properties and then only query them once.</br>  

# 1.1.2 #

## First release version of the new Homebridge Logo Platform Plugin ##  

It should work a lot better than the old Homebridge-Logo-TS plugin.</br> 
Each logo is now created with its accessories, so the communication with the logo can be regulated much better!</br> 