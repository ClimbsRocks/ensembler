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
    // CLEAN: I don't think we need to pass in a callback anymore
    utils.generateSummary( args, function() {

    });
  },

  // this method is primarily designed to work with machineJS. It is simply a way of determining when we will invoke makeEnsemble. 
  startListeners: function(numOfAlgosToWaitOn, args) {

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
