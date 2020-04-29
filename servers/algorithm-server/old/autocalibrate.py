import numpy as np
import math as math

def autocalibrate(n, nbrs, info, history, transmitters):
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

  nbr_contours = {
    (t, r): 1 / transmitters[t][r]['distance']
    for t in nbrs 
    for r in nbrs if t != r and r in transmitters[t] 
  }

  n_contour = { (n, nbr): 1 / info[nbr]['distance'] for nbr in nbrs }

  t_space = list({ t for (t, _) in nbr_contours })

  a = np.matrix([
    [
      100 if t == r else
      0 if (t, r) not in nbr_contours else 
      nbr_contours[(t, r)]
      for r in t_space
    ]
    for t in t_space
  ]).T

  b = np.matrix([
    0 if (n, r) not in n_contour else
    n_contour[(n, r)]
    for r in t_space
  ]).T

  p = np.matrix([
    [ info[t]['lng'], info[t]['lat'] ]
    for t in t_space
  ]).T

  # normalize
  a = np.apply_along_axis(lambda l: l / np.linalg.norm(l), axis=0, arr=a)
  b = np.apply_along_axis(lambda l: l / np.linalg.norm(l), axis=0, arr=b)

  # ax = b, x is amount contribution if each contour
  x = np.linalg.lstsq(a, b)[0]
  
  # weighting
  x = x**2

  # barycentric
  x_sum = np.sum(x)
  x = np.apply_along_axis(lambda l: l / x_sum, axis=0, arr=x)

  # if n == '103':
  #   print('-----')
  #   print(x)

  return p.dot(x)

def invert(v):
  maximum = np.max(v)
  return (maximum - v) / maximum

def positive_offset(v):
  minimum = np.min(v)
  return v - minimum if minimum < 0 else v

def normalize(v):
  total = np.sum(v)
  return v / total

def autocalibrate2(n, nbrs, info, history, transmitters):
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

  t_space = list({
    t
    for t in nbrs
    for r in nbrs
    if t != r 
    and t in transmitters and r in transmitters[t]
    and r in transmitters and t in transmitters[r]
  })

  # position matrix
  p = np.matrix([
    [ info[t]['lng'], info[t]['lat'] ]
    for t in t_space
  ]).T

  a = np.matrix([
    [
      0 if t == r else transmitters[t][r]['distance']
      for r in t_space
    ]
    for t in t_space
  ]).T

  b = np.matrix([
    info[t]['distance']
    for t in t_space
  ]).T

  # invert
  a = np.apply_along_axis(
    invert
    , axis=0
    , arr=a
  )

  b = np.apply_along_axis(
    invert
    , axis=0
    , arr=b
  )

  # unit vectors
  # a = np.apply_along_axis(lambda l: l / np.linalg.norm(l), axis=0, arr=a)
  # b = np.apply_along_axis(lambda l: l / np.linalg.norm(l), axis=0, arr=b)

  # solve for x the amount contribution of each contour
  x = np.linalg.lstsq(a, b)[0]

  # barycentric
  x = positive_offset(x)
  x = normalize(x ** 2)

  # nbr_contours = {
  #   (t, r): 1 / transmitters[t][r]['distance']
  #   for t in nbrs 
  #   for r in nbrs if t != r and r in transmitters[t] 
  # }

  # n_contour = { (n, nbr): 1 / info[nbr]['distance'] for nbr in nbrs }

  # t_space = list({ t for (t, _) in nbr_contours })

  # a = np.matrix([
  #   [
  #     100 if t == r else
  #     0 if (t, r) not in nbr_contours else 
  #     nbr_contours[(t, r)]
  #     for r in t_space
  #   ]
  #   for t in t_space
  # ]).T

  # b = np.matrix([
  #   0 if (n, r) not in n_contour else
  #   n_contour[(n, r)]
  #   for r in t_space
  # ]).T

  # p = np.matrix([
  #   [ info[t]['lng'], info[t]['lat'] ]
  #   for t in t_space
  # ]).T

  # # normalize
  # a = np.apply_along_axis(lambda l: l / np.linalg.norm(l), axis=0, arr=a)
  # b = np.apply_along_axis(lambda l: l / np.linalg.norm(l), axis=0, arr=b)

  # # ax = b, x is amount contribution if each contour
  # x = np.linalg.lstsq(a, b)[0]
  
  # weighting
  # x = x**2

  # # barycentric
  # x_sum = np.sum(x)
  # x = np.apply_along_axis(lambda l: l / x_sum, axis=0, arr=x)

  if n == '103':
    print('-----')
    # print('a', a)
    # print('b', b)
    print('x', x)
    print(t_space)

  return p.dot(x)