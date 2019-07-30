import { useState } from "react";


function getTimestamp() {
  var now = new Date();
  var time = [
    ("0" + now.getHours()).slice(-2),
    ("0" + now.getMinutes()).slice(-2),
    ("0" + now.getSeconds()).slice(-2)
  ];
  var timestamp = "[" + time.join(":") + "] ";
  return timestamp;
}

export const useLogger = logList => {
  const [logs, setLogs] = useState(logList);
  return {
    logs,
    log: newLog => {
      setLogs(prevLogs => [...prevLogs, `${getTimestamp()}${newLog}`]);
    },
    clearLogs: () => setLogs([])
  };
};