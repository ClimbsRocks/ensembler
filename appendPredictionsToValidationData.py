import csv
import sys
import json

import numpy as np
from scipy.sparse import csr_matrix, hstack

from sendMessages import printParent

fileNames = json.loads(sys.argv[1])

predictionsFile = fileNames['predictionsFile']
validationData = fileNames['validationData']
outputFile = fileNames['outputFile']

# continued callout to the person originally responsible for these functions:
# http://stackoverflow.com/questions/8955448/save-load-scipy-sparse-csr-matrix-in-portable-data-format
def save_sparse_csr(filename,array):
    np.savez(filename,data=array.data ,indices=array.indices, indptr=array.indptr, shape=array.shape )

def load_sparse_csr(filename):
    loader = np.load(filename)
    return csr_matrix(( loader['data'], loader['indices'], loader['indptr']), shape=loader['shape']) 

predictions = []
with open(predictionsFile, 'rU') as predictionsFile:
    inputRows = csv.reader(predictionsFile)
    for row in inputRows:
        predictions.append(row)

for rowIdx, predictionRow in enumerate(predictions):
    printParent('predictionRow in predictions')
    printParent(predictionRow)
    for colIdx, prediction in enumerate(predictionRow):
        try:
            predictions[rowIdx][colIdx] = float(prediction)
        except:
            printParent(repr(prediction))
            raise

# scipy.sparse matrices work on np.arrays, not python lists
# they also do not deal well with mixed data types
# TODO: this is potentially fragile as we expand to more and more problem types. 
    # the predictions files will likely always be floats, but the validation data oftentimes won't be
try:
    predictions = np.array(predictions, dtype=float)
except:
    predictions = np.array(predictions)
predictions = csr_matrix(predictions)

validationData = load_sparse_csr(validationData)

# we must pass in 'csr', otherwise it will oftentimes pick another sparse matrix format for us that is not compatible with our sparse saver and loader function
validationWithPredictions = hstack([validationData, predictions], 'csr')

save_sparse_csr(outputFile, validationWithPredictions)
