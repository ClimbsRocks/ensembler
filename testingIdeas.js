// Tests:
// 1. reads in all the files with the fileNameIdentifier in the inputFolderLocation
// 2. reads in all the files when the "all" value is passed
//   3. doesn't care about casing
// 4. Should mimic the headers in the first predictions file
// 5. Should be able to handle files with and without a header row
// 6. Should be able to read in a json object above the header row
// 7. Should write a file to the outputFolderLocation
// 8. If no value passed in for outputFolderLocation, should by default write to a directory two levels above it's own (assuming that the first level up will be the node_modules folder, and two levels up will be the root directory of whatever package is requiring this)
// 9. Should average the results of multiple prediction files together.- include data files in a test folder, know what the results are supposed to look like, and test the actual results against the known correct results. 
// 10. It should tell the user where the output folder is located
// 11. It should not tell the user where the output file is located if they pass in "silent" in some kind of a config object- this one might be post MVP. 

// Obviously, we can add in tests for methods other than averaging as we add them
// We will add in a check to make sure it's trying the comprehensive set of all combinations of input files. Can probably do this as math- figure out how many input files we have, calculate the combinations, and make sure a certain function has been called that many times. 
// 
