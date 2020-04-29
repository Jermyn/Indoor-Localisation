import React, { Component } from 'react'
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';
import Switch from '@material-ui/core/Switch';
import purple from '@material-ui/core/colors/purple';
import { withStyles } from '@material-ui/core/styles';
import DeviceControls from './DeviceControls'
import MaterialDialogForm from '../addDevices/MaterialDialogForm'

const styles = theme => ({
    colorSwitchBase: {
      color: purple[300],
      '&$colorChecked': {
        color: purple[500],
        '& + $colorBar': {
          backgroundColor: purple[500],
        },
      },
    },
    colorBar: {},
    colorChecked: {},
});

function packageDevice({id, beaconId, measuredPower, gattId, gattProfile}) {
    var device;
    device = {};
    if (id != null) {
        device.device = {
            id,
            type: 'mobile'
        };
    }
    if (beaconId != null) {
        device.beacon = {
            id: beaconId
        };
        if (measuredPower != null) {
            device.beacon.measuredPower = measuredPower;
        }
    }
    if (gattId != null) {
      device.gatt = {
        id: gattId
      };
      if (gattProfile != null) {
          device.gatt.profile = JSON.parse(gattProfile);
      }
    }
    console.log(device);
    return device;
  }

class MobileDevicesTableRow extends Component {
    state = {
        open: false,
        id: '',
        beaconId: '',
        gattId: '',
        measuredPower: -60,
        gattProfile: ''
    };

    componentDidMount() {
        const { device } = this.props;
        this.setState({ 
            id: device.id,
            beaconId: (device.beacon != null ? device.beacon.id : void 0),
            measuredPower: device.beacon.measuredPower,
            gattId: (device.gatt != null ? device.gatt.id : void 0),
            gattProfile: (device.gatt != null ? device.gatt.profile : void 0)
         });
    };

    handleEditButton = () => {
        this.setState({ open: true });
    };

    handleDeleteButton = () => {
        const { device, onDelete } = this.props;
        onDelete(device.id)
    };

    handleClose = () => {
        this.setState({ open: false });
    };

    handleChange = (e) => {
        this.setState({
            [e.target.id] : e.target.value
        })
    };

    handleConnectButton = () => {
        const { device, onConnect } = this.props;
        onConnect({
            device: {
                id: device.id
            },
            gatt: {
                id: device.gatt.id,
                connect: !device.gatt.connect
            }
        })
    }

    handleSubmit = (e) => {
        e.preventDefault();
        const device = {
            id: this.state.id,
            beaconId: this.state.beaconId,
            measuredPower: this.state.measuredPower,
            gattId: this.state.gattId,
            gattProfile: this.state.gattProfile
        }
        this.props.onEdit(packageDevice(device))
        // this.props.history.push('/Devices')
        this.setState({ open: false });
      };

    render() {
        const { device, classes } = this.props;
        return(
            <TableRow key={device.id}>
                <TableCell component="th" scope="row">
                {device.id}
                </TableCell>
                <TableCell align="left">{device.beacon.id}</TableCell>
                <TableCell align="left">
                {device.beacon.measuredPower != null ? device.beacon.measuredPower : void 0}</TableCell>
                <TableCell align="left">{device.gatt != null ? device.gatt.id : void 0}</TableCell>
                <TableCell align="left">{device.gatt != null ? JSON.stringify(device.gatt.profile) : void 0}</TableCell>
                <TableCell align="left">
                    {device.gatt != null ?
                        <Switch
                            checked={device.gatt != null ? device.gatt.connect : void 0}
                            value={device.gatt != null ? device.gatt.connect : void 0}
                            onClick={this.handleConnectButton}
                            classes={{
                                switchBase: classes.colorSwitchBase,
                                checked: classes.colorChecked,
                                bar: classes.colorBar,
                            }} 
                        />
                    : void 0}
                </TableCell>
                <TableCell align="left"><DeviceControls onDelete={this.handleDeleteButton} onEdit={this.handleEditButton}/></TableCell>
                <MaterialDialogForm 
                    title="Edit Mobile Device"
                    open={this.state.open} 
                    onClose={this.handleClose} 
                    aria_id="Edit-Devices"
                    onChange={this.handleChange}
                    rows={[
                      {key: 'id', type: 'text', label: 'id', defaultValue: device.id, readOnly: true},
                      {key: 'beaconId', type: 'text', label: 'beaconId', defaultValue: device.beacon != null ? device.beacon.id : void 0, readOnly: true},
                      {key: 'measuredPower', type: 'text', label: 'measuredPower', defaultValue: device.beacon != null ? device.beacon.measuredPower : void 0},
                      {key: 'gattId', type: 'text', label: 'gattId', defaultValue: device.gatt != null ? device.gatt.id : void 0, readOnly: true},
                      {key: 'gattProfile', type: 'text', label: 'gattProfile', defaultValue: device.gatt != null ? JSON.stringify(device.gatt.profile) : void 0}
                    ]}
                    onSubmit={this.handleSubmit}  
                />
            </TableRow>
        )
    }
}

export default withStyles(styles)(MobileDevicesTableRow)