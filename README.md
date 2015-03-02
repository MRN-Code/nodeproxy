# COINS nodeproxy
A reverse proxy server to sit between our services and clients.
The server will provide monitoring, service-hot-swapping and (eventually) load-balancing.

# ToDo
1. Install hapijs, good (logging) and boom (error reporting)
1. Get a basic reverse proxy running
1. Add logging
1. Add monitoring of logs (logstash?)
1. Modify COINS services to function properly behind a proxy
