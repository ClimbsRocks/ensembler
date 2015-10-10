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

What this does, effectively, is severely minimize the risk of including inaccurate classifiers. If the data says they're not helpful in making predictions against the dataset, we will not include them. 

## Installation

## Use

There are two public methods
