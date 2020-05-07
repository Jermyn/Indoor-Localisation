scripts=/home/root/node_client/scripts

function update_gateway {
  gateway=$(ip route | grep default | sed -r 's/^.*\ ([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)\ .*$/\1/' | tr -d '\n ')
  ping -c2 $gateway > /dev/null
  gateway_status=$(echo -ne $?)
}

function check_connection {
  if [[ $gateway_status != 0 ]]; then
    echo "Reconnecting to gateway, restarting localize.service"
    ifdown wlan0 && ifup wlan0 && systemctl restart localize
  else
    echo "Associated to $gateway"
  fi
}

update_gateway
check_connection

while [[ true ]]; do

  sleep 60
  update_gateway
  check_connection

done

