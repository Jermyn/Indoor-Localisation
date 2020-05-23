systemctl stop boot_up; systemctl disable boot_up
systemctl stop monitoring; systemctl disable monitoring
systemctl stop localize; systemctl disable localize

rm /etc/systemd/system/boot_up.service
rm /etc/systemd/system/monitoring.service
rm /etc/systemd/system/localize.service

systemctl daemon-reload
systemctl reset-failed

