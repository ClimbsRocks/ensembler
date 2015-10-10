# ensembler
> automatically ensemble machine learning predictions together

## NOTE: Right now this repo is under active development as of October 2015. Only the APIs section is accurate. The rest will be written over time. Currently, it only averages together the results of different predictors. 

If you already have a bunch of classifiers trained, ensembler will go through and find the best way of ensembling them together. 

### What does ensembling mean?
Ensembling, sometimes referred to as SYNONYMS_HERE, probably means exactly what you think it does: taking many different machine learning algorithms, and putting them together into one super predictor. 

### Why is ensembling great? 
Ensembling is frequently more accurate than any single algorithm can be. This is because all algorithms have their strengths and weaknesses. Some areas different classifiers might excel or struggle with:
  - outliers in the data set
  - picking out certain types of relationships in the data
  - generalization
Ensembles, because they provide the consensus view of several experts (trained classifiers), will frequently avoid overfitting problems that any one classifier might face. 

### Risk Minimization
ensembler will go through and test your predictions files in two primary ways:
1. It will go through all possible combinations of trained classifiers. 
  Example: Say your classifiers look like this: 
  `['neuralNetwork','randomForest','SVM']`
  This repo then would try all possible combinations of those classifiers:
  `['neuralNetwork']`  `['neuralNetwork','randomForest']` `['neuralNetwork', 'randomForest','SVM']`  `['randomForest']`  `['randomForest','SVM']` `['SVM']`  `['SVM','neuralNetwork']`
2. For each of those 7 combinations of classifiers, it will go through and try all of the different ensembling methodologies in the ensembleMethods.js file. 
  Examples include:
  - Picking the highest value
  - Picking the lowest value
  - Picking the most extreme value
  - Picking the most middle value
  - Picking the value from the most accurate classifier in the group
  - Picking the value from the two most accurate classifiers in the group
  - Taking a simple majority consensus for classification problems
  - Taking a weighted average
  - Taking a simple average (the only method currently implemented)
  - Maybe some method that penalizes algorithms that overfit the training data, and perform relatively poorly on the test data? 

What this does, effectively, is  minimize the risk of including inaccurate classifiers. If the data says they're not helpful in making predictions against the dataset, we will not include them. 

This, then, lets you go off and train as many classifiers as you would like, over whatever time period you like, and trust that ensembler will find the best combination of them for you. 

Ensembling also reduces the risk of overfitting to the data, because introducing more classifiers will bring predicted values closer to an average prediction across multiple sources, rather than the (possibly highly biased) opinion of a single classifier. 

## Installation


## Use


### API
There are two public methods, `createEnsemble`, and `startListeners`. 

`startListeners` simply waits to invoke `createEnsemble` until it has heard the required number of 'algoFinishedTraining' events fire. This is mostly a convenience function for ppComplete, though you may find it useful. 

#### `createEnsemble`
This is the primary method ensembler makes available. 
It takes in the following arguments:

##### `inputFolderLocation`
This argument is an absolute path to the folder that holds all the predictions from all the classifiers you have trained. Please see below for notes on the expected format of these files. 
##### `outputFolderLocation` OPTIONAL
This argument is optional. It is an absolute path to the location where we are writing the output file. If not passed in, it is assumed to be two directories above where ensembler is installed. This assumes that one directory up will be the node_modules folder, and two directories up will be the root directory of whatever repo you are working in. 

##### `fileNameIdentifier`
This argument is a unique string that appears in the name of all of the .csv files within this folder that we should include in ensembler. 

You can also pass in 'all', which will assume that all .csv files in the inputFolderLocation should be included. 

If you're looking for more details: please pass in some identifying string that will be in the fileNames of all the files we should run predictions on. The way I name my prediction files is to concat the classifier name and the original input data file name together, as in "neuralNetworkGiveMeSomeCredit.csv". In this way, all files in the predictions folder I point to, that have "GiveMeSomeCredit.csv" in their file name, will be predictions made by different classifiers on the GiveMeSomeCredit.csv data file. 

The unique identifier then, that we would expect for fileNameIdentifier, is "GiveMeSomeCredit". 


### Format of input prediction files
The input prediction files must all reside in the same folder, and must all be .csv filetypes. 

The files must have an 'ID' column, and a column with the predicted results from the classifier. 

The files may optionally have a column for observed value, called 'Observed Value'. This is the value that is known to be true for this row, as opposed to the predicions column, which holds the predicted value from the machine learning algorithm. Without the 'Observed Value' column, this ensembler will only be able to average the results together, as it would have no other way of determining which ensemble method is most accurate. 

The file must have a header row specifying which column is the 'ID' column, and which is the prediction column. 

The file may optionally contain a row below the header row that is the prettyNames. That is, the names you would like to see output in the final output file, if they are differen than 'ID' and 'Prediction'. Note that the 'Observed Value' column will NEVER be included in the final prediction file. 

If you are including a prettyNames row, you must include an extra column in the standard 'ID'/'Predictions' row that simply says 'prettyNames'. This lets us know that the following row is what should appear at the top of the output file. 

The ID of predictions must be consistent across all prediction files. ensembler matches up predictions across files based on this ID. 

Above the header row, the first row may optionally be a stringified JSON object. This JSON object must hold a property called 'jsonRow', set equal to `true`


### Format of output file
The output file will simply have two columns, 'ID' and 'Predictions'. 

If you passed in a 'prettyNames' row (with the additional 'prettyNames' column in the normal 'ID'/'Predictions' row), that prettyNames row is what will be the header row at the top of the output file instead of 'ID' and 'Predictions'. 

The 'Observed Value' column will never be in the output file. 

The output file will be a .csv filetype. 


