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

module.exports = function( argsObject, scriptName, callback ) {

  console.log('started running pythonUtils.js')
  var pyOptions = makePyOptions( JSON.stringify( argsObject ) );

  var pyController = PythonShell.run(path.join('./', scriptName), pyOptions, function(err) {
    if(err) {
      // exit code null means we killed the python child process intentionally
      if(err.exitCode !== null) {
        console.log('heard an error!');
        console.error(err);
      }
    } 

    console.log('finished running pythonUtils.js')

    if (typeof callback === 'function' ) {
      callback();
    }
    
  });

  // attach the message listeners to handle messages sent from python
  attachListeners(pyController);
  return pyController;
};
