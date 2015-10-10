var fs = require('fs');
var path = require('path');
var byline = require('byline');
var summary = {};
var ensembleMethods = require('./ensembleMethods.js');
var csv = require('fast-csv');
global.ensembleNamespace.summarizedAlgorithmNames = [];

module.exports = {

  generateSummary: function(fileNameIdentifier, locations, callback) {

    fs.readdir(locations.inputFolder, function(err,files) {
      if (err) {
        console.error('there are no files in the input folder',locations.inputFolder);

        console.error('. We need the predicted output from the classifiers in that folder in order to ensemble the results together. please run this library again, or copy/paste the results into the input folder, to create an ensemble.');
      } else {
        var fileCount = files.length;
        var finishedFiles = 0;
        files.forEach(function(fileName) {

          // only read .csv files, and make sure we only read in files that include the fileNameIdentifier the user passed in. 
          if (fileName.slice(-4).toLowerCase() === '.csv' && fileName.indexOf(fileNameIdentifier) !== -1) {
            // grab all the characters in the file name that are not '.csv' or the fileNameIdentifier that will be shared across all these files. 
            // what we are left with is a unique string for just this file that is a unique identifier for this particular algorithm. 
            var prettyFileName = fileName.slice(0,-4);
            prettyFileName = prettyFileName.split(fileNameIdentifier).join('');
            global.ensembleNamespace.summarizedAlgorithmNames.push(prettyFileName);

            var filePath = path.join(locations.inputFolder,fileName);
            var firstRow = true;

            // TODO: use a csv reader to read in the csv files. that prevents us from splitting on accidental commas in the middle of a field without doing crazy regex. 
            var pipingStream = byline(fs.createReadStream(filePath, {encoding: 'utf8'}));
            
            pipingStream.on('data', function(str) {
              var row = str.split(',');
              // TODO: allow for the possibility of the json obj in the first row
              // TODO: allow for the possibility of prettyNames in the second/third row
              // TODO: grab the header row and write that back out to the csv at the end
              // TODO: find which column is the ID column, and which is the prediction column
              if (firstRow) {
                firstRow = false;
                // skip it! 
              } else {
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
                summary[id][prettyFileName] = row[1];
                
              }
            });

            pipingStream.on('end', function() {
              finishedFiles++;
              if(finishedFiles === fileCount) {
                callback();
              }
            });

          } else {
            // if the file is not a .csv file, we will ignore it, and remove it from our count of files to parse
            fileCount--;
          }

        });
      }

      // handles off by one errors
      if(fileCount === 0) {
        // after the else statement where we parsed through all the files, fileCount is going to be the number of eligible files. 
        // while reading through the files is an asynch process, the process of determining if they are eligible to be read or not is synchronous. 
        console.error('we found no eligible files in',locations.inputFolder);
        console.error('please make sure that: \n 1. there are .csv files in that location, and \n 2. those .csv files include in their file names the string you passed in for the first argument to ensembler, which was:', fileNameIdentifier);
      }


    });
    
  },

  // this method assumes we have already gone through to perform the logic of selecting both the best set of classifiers, as well as the best ensemble method for that particular set of classifiers. 
  // right now, it defaults to all classifiers that met the criteria for generate summary (.csv file located in locations.inputFolder that had fileNameIdentifier somewhere in their file name), and assumes that averaging is the bestMethod. 
  calculateAggregatedPredictions: function(classifierNames, bestMethod) {
    var predictionCalculation = ensembleMethods[bestMethod];
    var results = [];
    var eligiblePredictions = [];

    // keep track of missing values to give the user an informative error message if they do not have predictions for some IDs that they do have for others. 
    var missingPredictions = {};
    classifierNames.forEach(function(clName) {
      missingPredictions[clName] = 0;
    });

    // TODO: use the actual header row here, instead of hard coding in these values like we are now
    results.push(['PassengerID','Survived']);
    // iterate through all the rows in our summary object, and pick out only the values from the eligible classifiers.
    for (var rowNum in summary) {
      // console.log('row:',row);
      // pick out only the predictions from the algos that were selected by createEnsemble:
      // reset eligiblePredictions to be an empty array for each row. 
      eligiblePredictions = [];

      // TODO TODO: update classifierNames, as it will likely be an array
      // classifierNames is a key-mirror object where each key and value are both the classifierName
      // pick out only the values from the eligible classifiers
      // TODO TODO: keep track of all the missing values
        // console log that summary of missing values at the end
        // for example, right now we probably don't have any predictions from the svm
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
      results.push([rowNum, output]);
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
      console.log('great, every file had predictions for the same set of IDs!');
    }
    return results;
  },

  writeToFile: function(fileNameIdentifier, locations, results, callback) {
    csv.writeToPath(path.join(locations.outputFolder, fileNameIdentifier + 'PredictedResults.csv'), results)
    .on('finish',function() {
      callback();
    });
  }
};
