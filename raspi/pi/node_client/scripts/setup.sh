# core system services
systemctl start bluetooth; systemctl enable bluetooth
systemctl stop wpa_supplicant; systemctl disable wpa_supplicant
systemctl stop connman; systemctl disable connman
systemctl stop redis; systemctl disable redis
systemctl stop wyliodrin-hypervisor; systemctl disable wyliodrin-hypervisor
systemctl stop wyliodrin-server; systemctl disable wyliodrin-server
killall -q wpa_supplicant udhcpc

# network interfaces
mkdir -p /etc/network/if-up.d /etc/network/if-down.d /etc/network/if-pre-up.d /etc/network/if-post-down.d /etc/network/if-post-up.d
cp configs/interfaces /etc/network/

# install custom services
systemctl stop boot_up; systemctl disable boot_up
systemctl stop monitoring; systemctl disable monitoring
systemctl stop localize; systemctl disable localize

cp services/boot_up.service    /etc/systemd/system
cp services/monitoring.service  /etc/systemd/system
cp services/localize.service    /etc/systemd/system

systemctl enable localize
systemctl enable monitoring
systemctl enable boot_up

systemctl start monitoring
systemctl start localize
systemctl start boot_up