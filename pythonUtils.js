var path = require('path');
var pyScriptDirectory = path.dirname(__filename);
var child_process = require('child_process');
var PythonShell = require('python-shell');


var makePyOptions = function() {
  var pyOptions = {
    mode: 'json',
    scriptPath: path.resolve(pyScriptDirectory),
    args: []
  };
  for (var i = 0; i < arguments.length; i++) {
    pyOptions.args.push(arguments[i]);
  }
  return pyOptions;
};

var attachListeners = function(pyShell) {
  pyShell.on('message', function(message) {
    if(message.type === 'console.log') {
      console.log('message from Python:',message.text);
    } else if( message.type === 'fileNames' ) {
      for( var key in message.text ) {
        fileNames[key] = message.text[key];
      }
    } 
    // this seems to help a lot with having node's garbage collection kick in quickly.
    message.text = null;
  });
};

module.exports = function( argsObject, callback ) {

  var pyOptions = makePyOptions( JSON.stringify( argsObject ) );

  var pyController = PythonShell.run('./addStage1Predictions.py', pyOptions, function(err) {
    if(err) {
      // exit code null means we killed the python child process intentionally
      if(err.exitCode !== null) {
        console.log('heard an error!');
        console.error(JSON.parse(err));
      }
    } 

    process.emit('finishedFormatting');
    if (typeof callback === 'function' ) {
      callback();
    }
    
  });

  attachListeners(pyController);
  return pyController;
};
