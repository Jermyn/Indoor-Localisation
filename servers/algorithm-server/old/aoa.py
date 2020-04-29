import numpy as np

def angleOfArrival(locations, transmitters):
  """
  Description:
    Given the estimated positions of transmitters,
    recalculate a new position based on the angle and distance to
    the closest receiver.
    Returns new locations dictionary
  Input:
    locations:    dict[node](mapId, pos)
    transmitters: dict[node][nbr]{'distance','scale','lat','lng'}
  Output:
    dict[node](mapId, pos)
  """  
  for transmitter, neighbours in transmitters.items():
    closest = sorted(neighbours.keys(), key=lambda k: neighbours[k]['distance'])[0]
    closestPos = np.matrix([neighbours[closest]['lng'], neighbours[closest]['lat']]).T
    (mapId, transmitterPos) = locations[transmitter]
    mag       = np.linalg.norm(closestPos - transmitterPos)
    unit      = np.nan_to_num((transmitterPos - closestPos) / mag)
    locations[transmitter] = (mapId, closestPos + neighbours[closest]['distance'] * unit)

  return locations