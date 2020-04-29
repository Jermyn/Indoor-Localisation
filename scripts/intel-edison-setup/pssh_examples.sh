# copy files
# pscp -h pssh_hosts -l root -A  /Users/benjaminhon/Developer/IndoorLocalization/edison/v14/node_client/up_bluetooth.sh /home/root/node_client

# execute commands
# pssh -h pssh_hosts -l root -i -A "systemctl restart localize"

# replace ip
# pssh -h pssh_hosts -l root -i -A "cd /home/root/node_client && sed -i -e \"s/ip:.*\$/ip: '137.132.165.161',/\" info.js"


# # update firmware
# pssh  -O StrictHostKeyChecking=no \
#       -O UserKnownHostsFile=/dev/null \
#       -h pssh_hosts \
#       -l root -i \
#       -A "cd /home/root/node_client ; git fetch origin mesh ; git reset --hard origin/mesh"

# # setup and restart
# pssh  -O StrictHostKeyChecking=no \
#       -O UserKnownHostsFile=/dev/null \
#       -h pssh_hosts \
#       -l root -i \
#       -A "cd /home/root/node_client ; bash scripts/setup.sh ; systemctl daemon-reload; systemctl restart boot_up; systemctl restart monitoring; systemctl restart localize"

# # reboot/shutdown
# pssh  -O StrictHostKeyChecking=no \
#       -O UserKnownHostsFile=/dev/null \
#       -h pssh_hosts \
#       -l root -i \
#       -A "shutdown now"

# restart localize
pssh  -O StrictHostKeyChecking=no \
      -O UserKnownHostsFile=/dev/null \
      -h pssh_hosts \
      -l root -i \
      -A "systemctl daemon-reload; systemctl restart localize"

# # disable services
# pssh  -O StrictHostKeyChecking=no \
#       -O UserKnownHostsFile=/dev/null \
#       -h pssh_hosts \
#       -l root -i \
#       -A "systemctl disable wifi_reconnect; systemctl disable up_bluetooth"

# # replace anchor.js
# pscp  -O StrictHostKeyChecking=no \
#     -O UserKnownHostsFile=/dev/null \
#     -h pssh_hosts \
#     -l root \
#     -A anchor.js /home/root/node_client


# # replace node_client
# pssh  -O StrictHostKeyChecking=no \
#       -O UserKnownHostsFile=/dev/null \
#       -h pssh_hosts \
#       -l root -i \
#       -A "cd /home/root ; rm -r node_client"

# pscp  -O StrictHostKeyChecking=no \
#     -O UserKnownHostsFile=/dev/null \
#     -h pssh_hosts \
#     -l root \
#     -A -r node_client /home/root/

