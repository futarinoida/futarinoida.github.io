msg = decodeURI(WScript.Arguments(0));
arr = msg.split(':\/\/');
WScript.Echo(arr[1].replace(/\//, ""));