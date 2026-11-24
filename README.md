# Country Explorer

Web app (HTML/CSS/JS) that fetches country data from an external API. Users can **search**, **filter by region**, and **sort** by name or population. Useful for students, travelers, and researchers.

- **Live (Load Balancer):** http://LB01_IP
- **Demo video (max 2 min):** PASTE_LINK_HERE

## API
[REST Countries API](https://restcountries.com) ([docs](https://restcountries.com/#api-endpoints-v3)). Free, **no API key needed**, so no secrets are in this repo. Thanks to the REST Countries developers.


## How It Works
 
 **The app.** `index.html` is the page, `style.css` styles it, and `app.js` fetches the country list from theREST Countries API in the browser and stores it in memory. Search, region filtering and sorting then run on that list locally, so they update instantly without more API calls. `cache.js` saves the API response in the browser for 1 hour, so repeat visits load faster and use fewer API requests. All API data is HTML-escaped before display to prevent XSS.

**The architecture.** Client (browser) -> Lb01 (HAProxy) -> Web01 or Web02 (Nginx) . The user only talks to Lb01, which forwards each request to one of the two web servers. Both host identical copies of the app, so either can answer.

 **Load balencing.**HAProxy uses `balance roundrobin`, which sends requests to Web01 and Web02 in turn. The `check` option makes HAProxy regularly test each server and stop sending traffic to one that  is down, so the site stays up if a server fails. Each web server adds an `X-Served-By` response header containing its hostname, which lets us see which server handled a request. Running the curl loop in "Test Load Balancing" below shows the answers alternating between the two servers, which proves the traffic is being split.

 **Why two servers.** One server is a single point of failure and has a capacity limit. With two servers behind a load balancer, the load is shared and the app keeps working if one server goes down.

## Run Locally
```bash
git clone https://github.com/nagasaro1-afk/country-explorer.git
cd country-explorer
python3 -m http.server 8000   # open http://localhost:8000
```
On Windows use `python -m http.server 8000`

## Deploy (run on Web01 and Web02)
```bash
sudo apt update && sudo apt install -y nginx git
git clone https://github.com/nagasaro1-afk/country-explorer.git
sudo cp country-explorer/{index.html,style.css,app.js,cache.js} /var/www/html/
echo 'add_header X-Served-By $hostname;' | sudo tee /etc/nginx/conf.d/served-by.conf
sudo nginx -t && sudo systemctl restart nginx
```
Update later: `cd country-explorer && git pull && sudo cp index.html style.css app.js cache.js /var/www/html/`

## Load Balancer (Lb01, HAProxy)
```bash
sudo apt update && sudo apt install -y haproxy
sudo tee -a /etc/haproxy/haproxy.cfg <<'CFG'

frontend http_front
    bind *:80
    default_backend web_servers

backend web_servers
    balance roundrobin
    server web01 WEB01_IP:80 check
    server web02 WEB02_IP:80 check
CFG
sudo haproxy -c -f /etc/haproxy/haproxy.cfg && sudo systemctl restart haproxy
```

## Test Load Balancing
```bash
for i in 1 2 3 4 5 6; do curl -sI http://LB01_IP | grep -i x-served-by; done
```
Output alternates between web-01 and web-02.

## Error Handling
API down or bad response gives a message plus Retry button. No matches gives a "no results" message. Missing fields show N/A.

## Challenges
- REST Countries v3.1 requires the `fields` parameter, so I request only the fields I need.
- API data is HTML-escaped before display to prevent XSS.
- Proved round-robin balancing with an `X-Served-By` response header.


## Bonus
API responses are cached in the browser (localStorage) for 1 hour , which cuts load time on repeat visits (`cache.js`).

## Credits
REST Countries API, Nginx, HAProxy.
