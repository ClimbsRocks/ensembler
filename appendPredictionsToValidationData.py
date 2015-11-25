import csv
import sys

import numpy as np
from scipy.sparse import csr_matrix, hstack

fileNames = sys.argv[2]
# TODO: pass in these three arguments
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

load_sparse_csr(validationData)

# put our predictions data into sparse format, so we can stack it with our validationData
predictionsSparse = csr_matrix(predictions)

# TODO: pass in 'csr' as a param, to ensure this is a csr matrix afterwards
validationWithPredictions = hstack([validationData, predictionsSparse])

save_sparse_csr(outputFile, validationWithPredictions)
