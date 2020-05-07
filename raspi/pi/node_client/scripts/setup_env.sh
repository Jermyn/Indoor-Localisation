#############################################################################
## $1 - node
#############################################################################

mkdir /etc/systemd/system/localize.service.d
cd /etc/systemd/system/localize.service.d
echo "
[Service]
Environment=NOBLE_REPORT_ALL_HCI_EVENTS=1
Environment=NOBLE_MULTI_ROLE=1
Environment=BLENO_ADVERTISING_INTERVAL=1000
Environment=ANCHOR=$1
Environment=UUID=77777777777777777777777777777777
Environment=MAJOR=65535
Environment=MINOR=$1
Environment=MEASURED_POWER=$2
" > /etc/systemd/system/localize.service.d/env.conf