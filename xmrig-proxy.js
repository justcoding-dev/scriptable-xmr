//
// xmrpool.eu widget
//
// Displays your current balance, hashrate and top workers 
// Add your wallet address, that you are using in xmrig, as parameter

// Expected input parameters
const expectedInput="http[s]://proxyAddress[:port]|apikey|hrCol"

// -------- BEGIN configuration section

// Number of workers to display
const maxWorkers = 4

// Font definitions
const statsFont = Font.mediumSystemFont(16)
const workerFont = Font.lightSystemFont(13)

// -------- END configuration section

// Column headers for the hashrate columns 
const colHeaders = [ '1m', '10m', '1h', '12h', '24h' ]

// Check the input parameter
let proxyAddress
let apikey
let hrCol

let widgetInput = args.widgetParameter

// DEBUG
if (!widgetInput) {
  // Input must be "proxyaddress|apikey"
  // widgetInput="http://10.0.0.1:8000|SECRETAPIKEYNO1|2"
}

if (widgetInput !== null) {
  [proxyAddress,apiKey,hrCol] = widgetInput.split("|");

  if (!proxyAddress) {
    throw new Error("Invalid parameter. Expected format: '" + expectedInput + "'")
  }

  if (!apiKey) {
    throw new Error("Invalid parameter. Expected format: '" + expectedInput + "'")
  }
  
  if (!hrCol) {
    hrCol = 2
  } else {
    hrCol = parseInt(hrCol)
  }

} else {
    throw new Error("No Widget paramter set. Expected format: " + expectedInput)
}

// Mining stats URL
const summaryUrl = (proxy) => proxy + '/1/summary'
const workerUrl = (proxy) => proxy + '/1/workers'

let sdata = await loadSummaryData()
let wdata = await loadWorkersData()
let widget = await createWidget(sdata, wdata)

if (!config.runsInWidget) {
  await widget.presentSmall()
}

log(widget)

Script.setWidget(widget)
Script.complete()

async function loadSummaryData() {
  
  log("Load data from " + summaryUrl(proxyAddress))
  
  var request = new Request(summaryUrl(proxyAddress))
  request.headers = {'Authorization': 'Bearer ' + apiKey}
  log(request)
  
  const data = await request.loadJSON()

//  if (data.stats.length === 0) {
//    return { error: 1 }
//  }
  
  return data
}

async function loadWorkersData() {
  
  log("Load data from " + workerUrl(proxyAddress))
  
  var request = new Request(workerUrl(proxyAddress))
  request.headers = {'Authorization': 'Bearer ' + apiKey}
  log(request)
  
  const data = await request.loadJSON()

//  if (data.stats.length === 0) {
//    return { error: 1 }
//  }
  
  return data
}


// Convert a hashrate of format 1.23 KH to 1023
function calcHashrate(hStr) {
  
  if (hStr == null) {
    return 0
  }
  
  [a, unit] = hStr.split(" ")
  let val = parseFloat(a)
  
  switch(unit) {
  case "H":
    break
  case "KH": 
    val = val * 1000
    break
  case "MH": 
    val = val * 1000000
    break
  case "GH": 
    val = val * 1000000000
    break
  case "TH":
    // Terahash... I wish... 
    val = val * 1000000000000
    break
  }
  // log(hStr + " -> " + val)
  
  return val
}

// Returns the name of the worker, stored in the first array position
function name(worker) {
  // log('Name of ' + worker + ': ' + worker[0])
  return worker[0]
}

// Return the hashrate of the worker in the configured timeframe, e.g. col 9 for 10min
function hashrate(worker) {
  hrPos = 8 + hrCol
  // log(worker + ': ' + worker[hrPos] + ' pos ' + hrPos)
  return worker[hrPos]
}

function sortWorkerByHashrate(a,b) {
  // log("Comparing " + name(a) + hashrate(a) +  ' to ' + name(b) + hashrate(b))
  return hashrate(b) - hashrate(a)
}

// Add a single worker with its hashrate to the list
function addWorker(list, worker) {
  
    list.addSpacer(1)
    let wStack = list.addStack()
    wStack.addSpacer(5)
    wStack.addText(name(worker).slice(0,15)).font = workerFont
    wStack.addSpacer()
    wStack.addText(hashrate(worker).toString()).font = workerFont

}

async function createWidget(data, wdata) {

  const list = new ListWidget()
  list.setPadding(4, 4, 4, 4)

  if (data.error) {
    log("data error: " + data.error)
    let errorMessage = list.addText('No stats found')
    errorMessage.font = Font.boldSystemFont(12)
//    errorMessage.textColor = textColor
    errorMessage.centerAlignText()
    
    return list
  }

  const hr = data.hashrate.total
    
  const worker_id = data.worker_id
  
  // Header line
  let headerText = list.addText(data.worker_id + ' / ' + colHeaders[hrCol])
  headerText.font = Font.headline()
  headerText.centerAlignText()
  
  list.addSpacer(6)
  
  // Hashrate line
  let rateStack = list.addStack()
  rateStack.addText("Rate:").font = statsFont
  rateStack.addSpacer()
  if (!data.hashrate) {
    data.hashrate = "---"
  }
  let rateText = rateStack.addText(data.hashrate.total[hrCol].toString()).font = statsFont

  list.addSpacer(1)

  // # Workers line
  let workerStack = list.addStack()
  workerStack.addText("Workers:").font = statsFont
  workerStack.addSpacer()
  let workerText = workerStack.addText(data.miners.now + '/' + data.miners.max).font = statsFont

  list.addSpacer(1)
  
  // log(wdata)
  const workers = wdata.workers.sort(sortWorkerByHashrate).filter(w => hashrate(w) > 0)


  // log(workers)   
  
  // Add the hashrates for the fastest workers
  for (let i=0; i < Math.min(workers.length, maxWorkers); i++) {
     addWorker(list, workers[i])
  }
  
  list.addSpacer()
    
  return list
}
