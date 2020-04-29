import numpy as np
from scipy.optimize import least_squares

def distanceMatrix(n, nbrs, info):
  """
  Description:
    returns distance matrix of nbrs (in radians)
  Input:
    nbrs:   neighbours of node n
    info:   information of all nodes
            dict[nbr]{'distance','scale','lat','lng'}
  Output:
    [ d1 d2 d3 ]
  """  
  return np.array([ info[nbr]['radians'] for nbr in nbrs ])

def sigmaMatrix(nbrs, info):
  return np.array([ info[nbr]['sigmaRadians'] for nbr in nbrs ])  

def numObservationsMatrix(nbrs, info):
  return np.array([ info[nbr]['numObservations'] for nbr in nbrs ])  

def positionMatrix(nbrs, info):
  """
  Description:
    returns position matrix of neighbours
  Input:
    nbrs:   neighbours of node n
    info:   information of all nodes
            dict[nbr]{'distance','scale','lat','lng'}
  Output:
    [ xa ya
      xb yb
      xc yc ]
  """
  return np.array([
  	[ info[nbr]['location']['lng'], info[nbr]['location']['lat'] ] for nbr in nbrs
  ])

def initialPosition(n, nbrs, info, history):
  closestNeighbour = info[nbrs[0]]
  if n in history and history[n]['location']['map']['id'] == closestNeighbour['location']['map']['id']:
    return history[n]['location']['latLng']
  else:
    return np.array([closestNeighbour['location']['lng'], closestNeighbour['location']['lat']])

def model(x, u):
  return ((x[0] - u[:,0])**2 + (x[1] - u[:,1])**2)**0.5

def weight(y, o, s):
  # return o / y
  return 1 / y**2
  # return 1 / ((1 + s) * y)
  # return o / ((1 + s) * y**2)
  # return o / ((1 + s**2) * y**2)
  # return o / (s + y)
  # return o / (s + y**2)

def residual(x, u, y, o, s):
  w = weight(y, o, s)
  return w * model(x, u) - w * y

def jacobian(x, u, y, o, s):
  w = weight(y, o ,s)
  J = np.empty((u.shape[0], x.size))
  den = ((x[0] - u[:,0])**2 + (x[1] - u[:,1])**2)**0.5
  J[:,0] = w * (x[0] - u[:,0]) / den
  J[:,1] = w * (x[1] - u[:,1]) / den  
  return np.nan_to_num(J)

def nlsq(n, nbrs, info, history, bounds):
  """
  Description:
    returns position matrix using info
  Input:
    n:      the target node
    nbrs:   neighbours of node n
    info:   information of all nodes
            dict[nbr]{'distance','scale','lat','lng'}
  Output:
    position of n
  """

  # print('--------')
  y       = distanceMatrix(n, nbrs, info)
  # print('y', y)
  u       = positionMatrix(nbrs, info)
  # print('u', u)
  s       = sigmaMatrix(nbrs, info)
  # print('s', s)
  o       = numObservationsMatrix(nbrs, info)
  # print('n', n)
  x0      = initialPosition(n, nbrs, info, history)
  # print('x0', x0)
  result  = least_squares(residual, x0, jac=jacobian, args=(u, y, o, s), bounds=bounds)
  # print (result.x)
  # result  = least_squares(residual, x0, jac=jacobian, args=(u, y, o, s))
  # print('result', result.x)
  # print('========')
  return result.x
