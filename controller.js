global.ensembleNamespace = {};
var fs = require('fs');
var path = require('path');
var utils = require('./utils.js');
var startShutdownListeners = require('./startShutdownListeners.js');


module.exports = {
  createEnsemble: function(args) {
    startShutdownListeners();
    // we're actually going to be running through ensembler twice: 
      // once for the validation data set
      // once for the actual predictions data set
    // if the user doesn't pass in a value, we'll assume they just want predictions
    args.rawInputFolder = args.inputFolder;
    if( args.validationRound === undefined ) {
      args.validationRound = false;
    } else if(args.validationRound) {
      // this is the case that validationRound is true
      // save the original input folder, so we can access it later to pass back to machineJS
      args.inputFolder = path.join(args.inputFolder, 'validation');
    } else {
      args.inputFolder = path.join(args.inputFolder, '..', 'ensembledPredictions');
      console.log('args.inputFolder in the case that this is not the validationRound:',args.inputFolder);
    }

    var fileNameIdentifier = args.fileNameIdentifier;
    global.ensembleNamespace.fileNameIdentifier = args.fileNameIdentifier;

    // generateSummary reads in the prediction files from each classifier, and loads them into an in-memory object that matches them all up by rowID. 
    // it takes a callback that will be invoked after reading all the files and loading in all the data. 
    utils.generateSummary( args, function() {

      // FUTURE: 
        // 1. Test all combinations of number of classifiers among the ones we've trained
          // 2. for each combination of classifiers, run every single one of our ensembling methods
          // 3. pick the [combination of classifiers, ensembling method] pair that has the lowest error rate across the data set

      // as outlined above, at some point in the future, bestClassifierList will be a calculated value. 
      // for now, just use all the classifiers whose data we have read in. 
      // var bestClassifierList = global.ensembleNamespace.summarizedAlgorithmNames;

      // calculateAggregatedPredictions uses the best combination of classifiers and ensembling method to create our final prediction. 
      // until we are ready for our version 3.0 release, we will simply pass it all of our classifiers, with the ensemble method of bagging them together. 
      // var results = utils.calculateAggregatedPredictions(bestClassifierList, 'average');
      
      // utils.writeToFile(fileNameIdentifier, args, results);
    });
  },

  // this method is primarily designed to work with machineJS. It is simply a way of determining when we will invoke makeEnsemble. 
  startListeners: function(numOfAlgosToWaitOn, args) {
    console.log('args inside startListeners in ensembler:', args);

    function checkIfFinished() {
      if( finishedAlgos === numOfAlgosToWaitOn ) {
        module.exports.createEnsemble(args);
      }
    }

    var finishedAlgos = 0;

    process.on('algoFinishedPredicting', function() {
      finishedAlgos++;
      console.log('numOfAlgosToWaitOn:', numOfAlgosToWaitOn, 'finishedAlgos:', finishedAlgos);
      checkIfFinished();
    });

    // if an algorithm has not proven effective for this data set after a certain number of tries, we are not going to train any more of them.
    // but, since we said at the start to expect a certain number of algorithms to be trained, we must still emit an event to notify ensembler that we are skipping over an algorithm
    process.on('algoSkippedTraining', function() {
      finishedAlgos++;
      checkIfFinished();
    });
  }

}
