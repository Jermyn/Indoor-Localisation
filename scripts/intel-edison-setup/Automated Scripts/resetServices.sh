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