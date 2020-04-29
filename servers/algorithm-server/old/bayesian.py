import numpy as np
import math
from scipy.stats import norm
from collections import defaultdict
from kalman import kalman2d

prior = defaultdict(lambda: {})

def multiplyGaussian(a,b):
  return (
    (a[0] * b[1] + b[0] * a[1]) / (a[1] + b[1]),
    a[1] * b[1] / (a[1] + b[1])
  )

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
    [ info[nbr]['lng'], info[nbr]['lat'] ] for nbr in nbrs
  ]
  return np.matrix(p).T

def obsSigma (d):
  return 1.4 ** (2 * d - 5.0)

def bayesian(n, nbrs, info):
  # position of nbrs
  p = positionMatrix(nbrs, info)

  for i, nbr in enumerate(nbrs):
    scale             = info[nbr]['scale']
    pos_prior         = prior[n]['pos'] if n in prior else p[:,0]
    static_pos        = p[:,i]
    static_to_prior   = np.nan_to_num((pos_prior - static_pos) / np.linalg.norm(pos_prior - static_pos))
    obs_sigma         = obsSigma(info[nbr]['distance'] * scale) / scale
    
    

    (pos_posterior, sigma_posterior) = kalman2d(
      pos_prior=pos_prior,
      sigma_prior=prior[n]['sigma'] if n in prior else np.matrix([[20.0/scale, 0],[0, 20.0/scale]]),
      pos_observation=static_pos + (info[nbr]['distance'] * static_to_prior),
      sigma_observation=np.matrix([[obs_sigma, 0], [0, obs_sigma]]),
      process_noise=np.matrix([[2.0/scale, 0], [0, 2.0/scale]])
    )

    prior[n]['pos']   = pos_posterior
    prior[n]['sigma'] = sigma_posterior

  return prior[n]['pos']
