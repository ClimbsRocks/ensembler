import pandas as pd
import json
import sys
import csv

from os import path

from sendMessages import printParent

printParent('inside matrixOutput.py')

# for multi-category data, we can choose to output a single column with all the categories contained in that column, or we can translate that into a set of binary columns, where each column represents a single categorical value. 
# if the final output is matrixOutput, create a separate file that can be easily referenced by the user

argv = json.loads(sys.argv[1])

printParent('argv')
printParent(argv)

resultsFileName = argv['resultsFile']

idHeader = ''
rowCount = 0
ids = []
predictions = []
with open(resultsFileName, 'rU') as resultsFile:
    inputRows = csv.reader(resultsFile)
    for row in inputRows:
        if rowCount == 0:
            idHeader = row[0]
        else:
            ids.append(row[0])
            predictions.append(row[1])
        rowCount += 1





# convert our predictions on the test set to a pandas series
pdPredictions = pd.Series(predictions)

# take our single column of category predictions, and turn it into a matrix, where each column represents a yes or no for a single category
matrixPredictions = pd.get_dummies(pdPredictions)
# get the header row from the data frame:
matrixHeaderRow = matrixPredictions.columns.values.tolist()
# convert from pandas data frame to a python list
matrixPredictions = matrixPredictions.values.tolist()

# add the id to the header row
outputFileHeaderRow = [idHeader] + matrixHeaderRow

# add matrix to the front of the name to make it obvious
# this also keeps the rest of our files consistent for ensembler
matrixPath = argv['matrixOutputFolder']
matrixFileName = argv['outputFileName']
with open( path.join(matrixPath, matrixFileName) , 'w+') as predictionsFile:
    csvwriter = csv.writer(predictionsFile)

    csvwriter.writerow(outputFileHeaderRow)
    for idx, listOfMatrixPredictions in enumerate(matrixPredictions):

        rowID = ids[idx]
        csvwriter.writerow( [rowID] + listOfMatrixPredictions )
printParent('we have written the final results in matrix format at:' + path.join(matrixPath, matrixFileName))

