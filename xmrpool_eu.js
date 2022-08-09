//
// xmrpool.eu widget
//
// Displays your current balance, hashrate and top workers 
// Add your wallet address, that you are using in xmrig, as parameter

// Expected input parameters: walletAddress
const expectedInput="walletAddress"

// -------- BEGIN configuration section

// Number of workers to display
const maxWorkers = 3

// Length of the balance string
const balanceLength = 7

// Font definitions
const statsFont = Font.mediumSystemFont(16)
const workerFont = Font.lightSystemFont(13)

// -------- END configuration section


// Check the input parameter
let walletAddress
let widgetInput = args.widgetParameter

if (widgetInput !== null) {
  [walletAddress] = widgetInput.split("|");

  if (!walletAddress) {
    throw new Error("Invalid parameter. Expected format: " + expectedInput)
  }

} else {
  throw new Error("No Widget paramter set. Expected format: " + expectedInput)
}

// Mining stats URL
const apiURL = (wallet) => `https://web.xmrpool.eu:8119/stats_address?address=${wallet}&longpoll=false`

let data = await loadData(walletAddress)
let widget = await createWidget(data)

if (!config.runsInWidget) {
  await widget.presentSmall()
}

log(widget)

Script.setWidget(widget)
Script.complete()

async function loadData(wallet) {
  
  // log("Load data from " + apiURL(walletAddress))
  
  const data = await new Request(apiURL(walletAddress)).loadJSON()

  if (data.stats.length === 0) {
    return { error: 1 }
  }
  
  return data
}

// Format the balance value. Balance is a long value in the JSON, must be divided by 10^12 to 
// get the actual XMR value
function formatBalance(value, length) {
  if (!value) {
    return '-'
  }

  let price = (parseFloat(value) / 1000000000000).toString().slice(0, length)
  return price
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

function hashrate(worker) {
  if (worker.hashrate == null) {
    return "0 H"
  }
  return worker.hashrate
}
function sortWorkerByHashrate(a,b) {
  // log("Comparing " + a.hashrate + b)
  return calcHashrate(hashrate(b)) - calcHashrate(hashrate(a))
}

// Add a single worker with its hashrate to the list
function addWorker(list, worker) {
  
    list.addSpacer(1)
    let wStack = list.addStack()
    wStack.addSpacer(5)
    wStack.addText(worker.workerId.slice(0,15)).font = workerFont
    wStack.addSpacer()
    wStack.addText(hashrate(worker)).font = workerFont

}

async function createWidget(data) {

  const list = new ListWidget()
  list.setPadding(4, 2, 4, 2)

  if (data.error) {
    log("data error")
    let errorMessage = list.addText('No stats found')
    errorMessage.font = Font.boldSystemFont(12)
    errorMessage.textColor = textColor
    errorMessage.centerAlignText()
    
    return list
  }

  const stats = data.stats
  const workers = data.perWorkerStats.sort(sortWorkerByHashrate)
    
  // Header line
  let headerText = list.addText("xmrpool.eu")
  headerText.font = Font.headline()
  headerText.centerAlignText()
  
  list.addSpacer(6)
  
  // Balance line
  let lineStack = list.addStack()
  lineStack.addText("Balance:").font = statsFont
  lineStack.addSpacer()
  lineStack.addText(formatBalance(stats.balance, balanceLength)).font = statsFont
  
  list.addSpacer(1)
  
  // Hashrate line
  let rateStack = list.addStack()
  rateStack.addText("Rate:").font = statsFont
  rateStack.addSpacer()
  let rateText = rateStack.addText(stats.hashrate).font = statsFont

  list.addSpacer(1)

  // # Workers line
  let workerStack = list.addStack()
  workerStack.addText("Workers:").font = statsFont
  workerStack.addSpacer()
  let workerText = workerStack.addText(workers.length.toString()).font = statsFont


  
  // log(workers)   
  
  // Add the hashrates for the fastest workers
  for (let i=0; i < Math.min(workers.length, maxWorkers); i++) {
     addWorker(list, workers[i])
  }
  
  // If there are more, unlisted workers, add a "..."
  if (workers.length > maxWorkers) {
    // list.addSpacer(-10)
    // list.addText("...").centerAlignText()
  }
  
  return list
}
