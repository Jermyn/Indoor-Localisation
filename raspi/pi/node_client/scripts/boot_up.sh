function update_bluetooth {
  bluetooth_up=$(hciconfig hci0 | grep -i up | wc -l)
}

function up_bluetooth {
  if [[ $bluetooth_up == 0 ]]; then
    echo "starting up bluetooth"
    rfkill block bluetooth && sleep 1 &&
    rfkill unblock bluetooth && sleep 1 &&
    hciconfig hci0 up && sleep 1
  else
    echo "bluetooth already up"
  fi
}

update_bluetooth
up_bluetooth