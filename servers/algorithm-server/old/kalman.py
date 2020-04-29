import numpy as np

def multiplyGaussian(a,b):
  return (
    (a[0] * b[1] + b[0] * a[1]) / (a[1] + b[1]),
    a[1] * b[1] / (a[1] + b[1])
  )

def kalman2d(pos_prior, sigma_prior, pos_observation, sigma_observation, process_noise):
  sigma_prior               += process_noise
  K                         = sigma_prior * np.linalg.inv(sigma_prior + sigma_observation)
  MU                        = pos_prior + K * (pos_observation - pos_prior)
  SIGMA                     = sigma_prior - K * sigma_prior
  return (MU, SIGMA)