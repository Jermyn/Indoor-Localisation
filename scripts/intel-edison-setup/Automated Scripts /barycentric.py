import numpy as np
import math
import pdb

def distanceMatrix(n, nbrs, info):
  """
  Description:
    returns distance matrix of nbrs
  Input:
    nbrs:   neighbours of node n
    info:   information of all nodes
            dict[nbr]{'distance','scale','lat','lng'}
  Output:
    [ d1 d2 d3 ]
  """  
  return [ info[nbr]['distance'] for nbr in nbrs ]

def positionMatrix(nbrs, info):
  """
  Description:
    returns position matrix of neighbours
  Input:
    nbrs:   neighbours of node n
    info:   information of all nodes
            dict[nbr]{'distance','scale','lat','lng'}
  Output:
    [ xa xb xc
      ya yb yc ]
  """  
  p = [
    [ info[nbr]['location']['lng'], info[nbr]['location']['lat'] ] for nbr in nbrs
  ]
  return np.matrix(p).T

def barycentric(n, nbrs, info):
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
  dist = distanceMatrix(n, nbrs, info)
  d           = np.matrix(distanceMatrix(n, nbrs, info)).T
  w           = np.multiply(
                  d,
                  np.add(
                    1,
                    np.power(np.e, np.subtract(0.8 * d, 4))
                  ) 
                )
  inr         = np.nan_to_num(np.power(w, -1))
  total       = np.sum(inr)
  b           = np.nan_to_num(np.divide(inr, total))
  p           = positionMatrix(nbrs, info)
  pos         = p.dot(b)
  # pdb.set_trace()

  return pos
