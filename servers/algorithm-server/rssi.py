import math

def rssiToDistance(rssi, measuredPower):
  return 10**((rssi - measuredPower) / -20)

# def rssiToDistanceVariance(rssi_mu, rssi_sigma, measuredPower):
#   return (math.log(10) / -20)**2 * 10**((rssi_mu - measuredPower) / -10) * rssi_sigma

def rssiToDistanceVariance(rssi_mu, rssi_sigma, measuredPower):
  return  (10**((rssi_mu - measuredPower)/-20) * math.log(10) / -20)**2 * rssi_sigma

def getMeasuredPower(rssi, distance):
  return float(20*math.log10(distance) + rssi)

def getOffset(distance1, distance2, rssi1, rssi2):
  # if (rssiToDistance(rssi2, rssi1) < (distance2)):
  return float("{0:.2f}".format(0.5*((20*math.log10(distance2)) - 20*math.log10(distance1) + rssi2 - rssi1)))
  # elif (rssiToDistance(rssi2, rssi1) > (distance2)):
  #   return float("{0:.2f}".format(0.5*((20*math.log10(distance2)) - 20*math.log10(distance1) + rssi2 - rssi1)))
  # else:
  #   return 0