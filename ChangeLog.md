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