const timersFolders = {
    2: [10],
    3: [5, 8, 10],
    4: [8, 10],
    5: [5, 10],
    6: [10],
  }

  function f (a){
    if (a.length()>1)
        a.shift();
  }


  console.log(timersFolders[1])
  f(timersFolders[1])
  console.log(f(timersFolders[1]))
  console.log(timersFolders)