# scriptable-xmr

Some Monero-Mining related scripts for the iOS-widget-app Scriptable

## xmrpool.eu.js

Display statistics from xmrpool.eu in a widget

### Configuration

Add your wallet address as parameter for the widget

Checkout the first variable definitions if you want to change the font sizes

## xmrig-proxy.js

Display hashrate (total and top workers) from a xmrig proxy.

### Configuration

Set your proxy address, API key and hashrate column index as parameter for the script,
e.g. *http://192.168.1.1:8088|MYVERYSCRETAPIKEY|2*

The hashrate column index can be

0. 1 min averag
1. 10 min average
2. 1 hour average
3. 12 hour average
4. 24 hour average
