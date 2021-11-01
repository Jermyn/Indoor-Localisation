import pandas as pd
import numpy as np
import sys

rpiDict = {}
device = ['rpi4', 'rpi8', 'rpi9', 'rpi10', 'rpi12', 'rpi13', 'rpi15', 'rpi16', 'rpi17', 'rpi18', 'rpi19', 'rpi21', 'rpi24']

def finalResults_obj(a , b , y):
	return 10**((y - b)/(-10 * a))

def finalResults_lin(a , b , y):
	return (y - b)/a

def standform(mp , c ,  y):
    return 10**((y - mp)/(-20))

def calibratemain():
    global rpiDict
    
    total_curve_err = 0
    total_linear_err = 0
    total_stand_err = 0
    stand_err = []
    curvefit_err = []
    linear_err = []
    avg_err = []

    pd.set_option('display.float_format','{:.3f}'.format) #set float precision to 3dp
    pd.set_option('display.max_columns', None)
    pd.set_option('display.max_rows', None)

    data = pd.read_csv('final_df.csv', encoding='unicode_escape')


    mpDict = {
        " rpi4": [-66.23 , [0.96267022 , -61.49629474] , [-0.69847302 , -64.27157371]], 
        " rpi8": [-65.07 , [2.62182266 , -47.07867223] , [-1.94105208 , -54.66537272]], 
        " rpi9": [-62.78 , [2.49487856 , -45.09047558] , [-1.92574902 , -51.98401941]], 
        " rpi10": [-61.25 , [1.86467698 , -50.76393092] , [-1.45860154 , -55.95602761]],
        " rpi12": [-51.9 , [2.98553551 , -37.83563058] , [-2.55563761 , -45.12987392]], 
        " rpi13": [-58.48 , [1.79886383 , -47.54099919] , [-1.79603179 , -50.75892123]], 
        " rpi15": [-53.15, [1.43407245 , -52.79211202] , [-1.05911623 , -57.11114732]],
        " rpi16": [-52.44 , [0.82779288 , -54.63175788] , [-0.66901203 , -56.70357352]], 
        " rpi17": [-62.72 , [0.94308194 , -56.93118413] , [-0.89086709 , -58.51828491]],
        " rpi18": [-51.46 , [1.21533761 , -56.87345219] , [-0.94619784 , -59.86514625]], 
        " rpi19": [-62.85 , [1.72090632 , -54.33890133] , [-1.17701294 , -59.76942781]], 
        " rpi21": [-54.95 , [2.20490401 , -47.43924] , [-1.77289882 , -53.19265597]], 
        " rpi24": [-55.58 , [1.28809537 , -55.76573436] , [-1.04436452 , -58.51541915]]
        }

    for dev in device:
        rpi = ' ' + str(dev)
        mp = mpDict[rpi][0]

        obj_a = mpDict[rpi][1][0]
        obj_b = mpDict[rpi][1][1]

        lin_a = mpDict[rpi][2][0]
        lin_b = mpDict[rpi][2][1]

        onlyAnchor = data[data["anchorID"] == rpi] 
        y_column = onlyAnchor.iloc[: , 2] # All the average rssi values

        x_column = onlyAnchor.iloc[:, 3] # All the distance measured

        actual_dist = np.array(x_column)
        avg_rssi = np.array(y_column)

        for i in range(len(onlyAnchor)):
            actual = actual_dist[i]
            y = avg_rssi[i]
            dist_curvefit = finalResults_obj(obj_a , obj_b , y)
            dist_lin = finalResults_lin(lin_a , lin_b , y)
            dist_stand = standform(mp , 0 , y)

            curve_err = abs(actual - dist_curvefit)
            lin_err = abs(actual - dist_lin)
            s_err = abs(actual - dist_stand)

            curvefit_err.append(curve_err)
            linear_err.append(lin_err)
            stand_err.append(s_err)

        for i in range(len(onlyAnchor)):
            total_curve_err = total_curve_err + curvefit_err[i]
            total_linear_err = total_linear_err + linear_err[i]
            total_stand_err = total_stand_err + stand_err[i]
         
        curErr_avg = total_curve_err/len(curvefit_err)
        linErr_avg = total_linear_err/len(linear_err)
        standErr_avg = total_stand_err/len(stand_err)

        avg_err.append(curErr_avg)
        avg_err.append(linErr_avg)
        avg_err.append(standErr_avg)


        print("Mean error of curve fitting of general formula: " , curErr_avg)

        print("Mean error of linear fit: " , linErr_avg)

        print("Mean error of using general formula itself: " , standErr_avg)
    
        if rpi not in rpiDict:
            rpiDict.update({rpi.split(' ')[1]:{}})
        for i in range(len(avg_err)):
            if(min(avg_err) == avg_err[i]):
                if i == 0:
                    rpiDict[rpi.split(' ')[1]] = {'a': obj_a , 'b': obj_b , "eqn": finalResults_obj}
                elif i == 1:
                    rpiDict[rpi.split(' ')[1]] = {'a': lin_a , 'b': lin_b , "eqn": finalResults_lin}
                else:
                    rpiDict[rpi.split(' ')[1]] = {'a': mp , 'b': 0, "eqn": standform}
    
def getEqn(rpi):
    global rpiDict
    return rpiDict[rpi]['a'], rpiDict[rpi]['b'], rpiDict[rpi]['eqn']

calibratemain()
