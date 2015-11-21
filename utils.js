var fs = require('fs');
var fse = require('fs-extra');
var path = require('path');
var byline = require('byline');
// TODO: rename summary to predictionsSummary
var summary = {};
var ensembleMethods = require('./ensembleMethods.js');
var fastCSV = require('fast-csv');
var csv = require('csv');
global.ensembleNamespace.summarizedAlgorithmNames = [];
global.ensembleNamespace.predictionsMatrix = [];
global.ensembleNamespace.dataMatrix = [];

module.exports = {

  findFiles: function(args, findFilesCallback) {
    var fileNameIdentifier = args.fileNameIdentifier;
    global.ensembleNamespace.scores = [];

    fs.readdir(args.inputFolder, function(err,files) {
      if (err) {
        console.error('there are no files in the input folder:',args.inputFolder);

        console.error('We need the predicted output from the classifiers in that folder in order to ensemble the results together. Please run this library again, or copy/paste the results into the input folder, to create an ensemble.');
      } else {
        findFilesCallback(args, files);
      }
    });
  },

  readFiles: function(args, files) {
    global.ensembleNamespace.fileCount = files.length;
    global.ensembleNamespace.finishedFiles = 0;

    // TODO: do this on a setInterval, so that if we are eventually reading in 1000 files, we can do that at a steady pace, rather than all at once. 
    files.forEach(function(fileName) {
      module.exports.readOneFile(args, fileName, module.exports.processOneFilesData);
    });

    // handles off by one errors
    if(global.ensembleNamespace.fileCount === 0) {
      // inside of readOneFile, the first thing we do is check (synchronously), whether that file is eligible or not
        // eligibility meaning is it a .csv file, and does it have our fileNameIdentifier in the file's name?
      // if we find it is not eligible, we are not going to engage in the asynchronous process of reading the file in, and will just finish as a purely synchronous process. 
      // in other words, if we have reached this point and fileCount is 0, we have synchornously checked all files and determined none are eligible.
      console.error('we found no eligible files in',args.inputFolder);
      console.error('please make sure that: \n 1. there are .csv files in that location, and \n 2. those .csv files include in their file names the string you passed in for the first argument to ensembler, which was:', fileNameIdentifier);
    }
  },

  readOneFile: function(args, fileName, readOneFileCallback) {
    var fileNameIdentifier = args.fileNameIdentifier;
    // only read .csv files, and make sure we only read in files that include the fileNameIdentifier the user passed in. 
    if (fileName.slice(-4).toLowerCase() === '.csv' && fileName.indexOf(fileNameIdentifier) !== -1) {
      // grab all the characters in the file name that are not '.csv' or the fileNameIdentifier that will be shared across all these files. 
      // what we are left with is a unique string for just this file that is a unique identifier for this particular algorithm. 
      var prettyFileName = fileName.slice(0,-4);
      prettyFileName = prettyFileName.split(fileNameIdentifier).join('');
      global.ensembleNamespace.summarizedAlgorithmNames.push(prettyFileName);

      var filePath = path.join(args.inputFolder,fileName);

      // read in this predictions file
      fs.readFile(filePath, function(err, data) {
        if(err) {
          console.log('we had trouble reading in a file.');
          console.error(err);
        }

        // turn the blob of text into rows
        csv.parse(data, function(err, output) {
          if(err) {
            console.log('we had trouble interpreting this file\'s data as csv data');
            console.log(filePath);
            console.error(err);
          } else {
            readOneFileCallback(output, args, fileName);
          }
        });
      });
    } else {
      // if the file is not a .csv file, we will ignore it, and remove it from our count of files to parse
      global.ensembleNamespace.fileCount--;
    }
  },

  checkIfMatrixIsEmpty: function(matrixLength) {
    // populate the matrix with empty arrays for each row if the matrix is empty
    if( global.ensembleNamespace.dataMatrix[0] === undefined) {
      for (var i = 0; i < matrixLength; i++) {
        global.ensembleNamespace.dataMatrix.push([]);
      }
    }
  },

  processOneFilesDataMatrix: function(data, args) {
    // i know it's weird to see, but checkIfMatrixIsEmpty is synchronous. 
    checkIfMatrixIsEmpty(data.length);

    for( var i = 0; i < data.length; i++ ){
      global.ensembleNamespace.dataMatrix[i].push(data[i]);
    }
  },

  averageResults: function() {
    var idAndPredictionsByRow = [];
    for( var i = 0; i < global.ensembleNamespace.dataMatrix.length; i++ ) {

      var row = global.ensembleNamespace.dataMatrix[i];
      var sum = 0;
      for(var i = 0; i < row.length; i++) {
        sum += row[i];
      }
      var rowAverage = sum / row.length;

      // TODO: get the id for this row somehow.

      idAndPredictionsByRow.push([getIdSomehow, rowAverage]);
    }
  },

  processOneFilesData: function(data, args, fileName) {
    var fileNameIdentifier = args.fileNameIdentifier;
    var prettyFileName = fileName.slice(0,-4);
    prettyFileName = prettyFileName.split(fileNameIdentifier).join('');

    var fileNameIdentifier = args.fileNameIdentifier;
    
    // the first row holds the validationScore and trainingScore for this algorithm
    var scoresObj = {
      scores: data[0],
      fileName: fileName
    };
    global.ensembleNamespace.scores.push(scoresObj);
    // the second row holds the headerRow
    global.ensembleNamespace.headerRow = data[1];

    for(var i = 2; i < data.length; i++) {
      var row = data[i];
      // the id is stored in the first column
      var id = row[0];
      if(summary[id] === undefined) {
        summary[id] = {};
      }
      // the predicted values might have gotten saved as strings when we want them to be numbers. if so, convert them to numbers here.
      if(parseFloat(row[1]) !== NaN) {
        row[1] = parseFloat(row[1]);
      }

      // the fileName must, of course, be a unique identifier for this particular file. As such, it is quite useful as a unique identifier for the predictions contained in this file. 
      // right now we are simply reading in all the results from the different files and loading them into one large in-memory object. 
      // we are not yet performing any calculations or logic on the data. 
      //the prediction is stored in the second column

      // summary object, for this rowID, for this algorithm (prettyFileName), is equal to the current prediction
      summary[id][prettyFileName] = row[1];
    }

    global.ensembleNamespace.finishedFiles++;
    if(global.ensembleNamespace.finishedFiles === global.ensembleNamespace.fileCount) {
      // TODO: figure out which callback is supposed to be invoked here.
      module.exports.copyBestScores(args);
    }
  },

  copyBestScores: function(args) {

    // sort the array holding all of our validation and training scores:
    global.ensembleNamespace.scores.sort(function(algo1,algo2) {
      try {
        // scores is an array with validation and training scores from machineJS. 
        // the validation score is at index 0. 
        return parseFloat(algo1.scores[0]) - parseFloat(algo2.scores[0]);
      } catch(err) {
        return algo1.scores[0] - algo2.scores[0];
      }
    });
    global.ensembleNamespace.scores.reverse();

    console.log('sorted scores!');
    console.log(global.ensembleNamespace.scores);

    var bestFolder = path.join(args.inputFolder, 'bestScores' + global.ensembleNamespace.fileNameIdentifier);
    fse.mkdirpSync( bestFolder );

    // copy our 5 best scores into their own folder. this lets us see quickly which algos worked, and then have our best results easily available for analysis.
    for( var i = 0; i < 5; i++) {
      var predictionFile = global.ensembleNamespace.scores[i].fileName;
      var sourceFile = path.join( args.inputFolder, predictionFile );
      var destinationFile = path.join( bestFolder, predictionFile );
      fse.copySync(sourceFile, destinationFile);
    }
    args.generateSummaryCallback();
  },

  generateSummary: function(args, callback) {

    args.generateSummaryCallback = callback;

    module.exports.findFiles(args, module.exports.readFiles);

  },

  // this method assumes we have already gone through to perform the logic of selecting both the best set of classifiers, as well as the best ensemble method for that particular set of classifiers. 
  // right now, it defaults to all classifiers that met the criteria for generate summary (.csv file located in args.inputFolder that had fileNameIdentifier somewhere in their file name), and assumes that averaging is the bestMethod. 
  calculateAggregatedPredictions: function(classifierNames, bestMethod) {
    var predictionCalculation = ensembleMethods[bestMethod];
    var results = [];
    var eligiblePredictions = [];

    // keep track of missing values to give the user an informative error message if they do not have predictions for some IDs that they do have for others. 
    var missingPredictions = {};
    classifierNames.forEach(function(clName) {
      missingPredictions[clName] = 0;
    });

    results.push(global.ensembleNamespace.headerRow);
    // iterate through all the rows in our summary object, and pick out only the values from the eligible classifiers.
    for (var rowNum in summary) {
      // console.log('row:',row);
      // pick out only the predictions from the algos that were selected by createEnsemble:
      // reset eligiblePredictions to be an empty array for each row. 
      eligiblePredictions = [];

      // pick out only the values from the eligible classifiers
      classifierNames.forEach(function(clName) {
        var predictedNum = summary[rowNum][clName];
        if (predictedNum === undefined) {
          missingPredictions[clName]++;
        } else {
          eligiblePredictions.push(predictedNum);
        }
      });

      // ensembleMethods holds all the ways we have of ensembling together the results from different predictions. 
      // each method takes in an array, and returns a single number
      var output = predictionCalculation(eligiblePredictions);
      if( global.argv.binaryOutput === 'true' ) {
        output = Math.round(output);
      }
      results.push([parseInt(rowNum, 10), output]);
    }

    var missingCount = 0;
    for (var key in missingPredictions) {
      missingCount += missingPredictions[key];
    }

    if (missingCount > 0) {
      console.error('there were inconsistent IDs of predictions across classifiers');
      console.error('these files were missing the following counts of IDs that other classifiers had predictions for :');
      console.error(missingPredictions);
    } else {
      console.log('great, every file had predictions for the exact same set of IDs!');
    }
    return results;
  },

  writeToFile: function(fileNameIdentifier, args, results, callback) {
    // TODO: refactor to use the csv module.
    console.log('results:',results);
    fastCSV.writeToPath(path.join(args.outputFolder, global.argv.outputFileName + 'ppcResults.csv'), results)
    .on('finish',function() {
      callback();
    });
  }
};
