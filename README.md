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

There are two public methods

## Format of input prediction files
The files must have an 'ID' column, and a column with the predicted results from the classifier. 

The files may optionally have a column for observed value, called 'Observed Value'. This is the value that is known to be true for this row, as opposed to the predicions column, which holds the predicted value from the machine learning algorithm. Without the 'Observed Value' column, this ensembler will only be able to average the results together, as it would have no other way of determining which ensemble method is most accurate. 

The file must have a header row specifying which column is the 'ID' column, and which is the prediction column. 

The file may optionally contain a row below the header row that is the prettyNames. That is, the names you would like to see output in the final output file, if they are differen than 'ID' and 'Prediction'. Note that the 'Observed Value' column will NEVER be included in the final prediction file. 

If you are including a prettyNames row, you must include an extra column in the standard 'ID'/'Predictions' row that simply says 'prettyNames'. This lets us know that the following row is what should appear at the top of the output file. 

The ID of predictions must be consistent across all prediction files. ensembler matches up predictions across files based on this ID. 

Above the header row, the first row may optionally be a stringified JSON object. This JSON object must hold a property called 'jsonRow', set equal to `true`

## Format of output file


