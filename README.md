# Soccerguru Autoclaim

## Features
- Automates hourly claiming of players.
- Automates daily claiming of credit reward.

## How to get Auth Token?
1. Open Discord on your browser, logged into the account you intend to use,
2. Open the developer tools by pressing F12.
3. Click the "Console" tab.
4. Copy this script and press enter.
```javascript
(webpackChunkdiscord_app.push([[''],{},e=>{m=[];for(let c in e.c)m.push(e.c[c])}]),m).find(m=>m?.exports?.default?.getToken!==void 0).exports.default.getToken()
```
5. The token code will appear below it.

## Usage
```bash
node worker.js
```
The script will run automatically every 5 minutes