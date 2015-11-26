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
    # one option would be to create a new sparse matrix that is the size of our inputRows matrix
    for row in inputRows:
        predictions.append(row)

# predictions = np.ndarray(predictions)
# predictions = predictions.astype(float)

predictions = np.array(predictions, dtype=float)
predictions = csr_matrix(predictions)

validationData = load_sparse_csr(validationData)

# put our predictions data into sparse format, so we can stack it with our validationData
# predictionsSparse = csr_matrix(np.array(predictions))

# TODO: pass in 'csr' as a param, to ensure this is a csr matrix afterwards
# validationWithPredictions = hstack([validationData, predictionsSparse])
# printParent('validationData.shape' + str(validationData.shape))
# printParent('len(predictions)' + str(len(predictions)) )

# we must pass in 'csr', otherwise it will oftentimes pick another sparse matrix format for us that is not compatible with our sparse saver and loader function
validationWithPredictions = hstack([validationData, predictions], 'csr')

# printParent('validationWithPredictions.shape' + str(validationWithPredictions.shape))

save_sparse_csr(outputFile, validationWithPredictions)
