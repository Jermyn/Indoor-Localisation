import React, { Component } from 'react'
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';
import { withStyles } from '@material-ui/core/styles';
import DeviceControls from './DeviceControls'
import MaterialDialogForm from '../addDevices/MaterialDialogForm'

const styles = theme => ({
    button: {
        margin: theme.spacing.unit,
    },
    textField: {
        marginLeft: theme.spacing.unit,
        marginRight: theme.spacing.unit,
    },
})

function packageDevice({id, anchorId, sensitivity, beaconId, measuredPower, offset}) {
    var device;
    device = {};
    if (id != null) {
        device.device = {
            id,
            type: 'static'
        };
    }
    if (anchorId != null) {
        device.anchor = {
            id: anchorId
        };
        if (sensitivity != null) {
            device.anchor.sensitivity = sensitivity;
        }
        if (measuredPower != null) {
            device.anchor.measuredPower = measuredPower;
        }
        if (offset != null) {
            device.anchor.offset = offset;
        }
    }
    if (beaconId != null) {
            device.beacon = {
                id: beaconId
        };
    }
    return device;
}

class StaticDevicesTableRow extends Component {
    state = {
        open: false,
        id: '',
        anchorId: '',
        sensitivity: 0,
        beaconId: '',
        measuredPower: -60,
        offset: 0
    };

    componentDidMount() {
        const { device } = this.props;
        this.setState({ 
            id: device.id,
            anchorId: device.anchor.id,
            sensitivity: device.anchor.sensitivity,
            beaconId: (device.beacon != null ? device.beacon.id : void 0),
            measuredPower: device.anchor.measuredPower,
            offset: device.anchor.offset
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

    handleSubmit = (e) => {
        e.preventDefault();
        const device = {
            id: this.state.id,
            anchorId: this.state.anchorId,
            sensitivity: this.state.sensitivity,
            beaconId: this.state.beaconId,
            measuredPower: this.state.measuredPower,
            offset: this.state.offset
        }
        this.props.onEdit(packageDevice(device))
        // this.props.history.push('/Devices')
        this.setState({ open: false });
      };

    render() {
        const { device } = this.props;
        return(
            <TableRow key={device.id}>
                <TableCell component="th" scope="row">
                {device.id}
                </TableCell>
                <TableCell align="left">{device.anchor.id}</TableCell>
                <TableCell align="left">{device.anchor.sensitivity}</TableCell>
                <TableCell align="left">{device.anchor.beaconId}</TableCell>
                <TableCell align="left">{device.anchor.measuredPower}</TableCell>
                <TableCell align="left">{device.anchor.offset}</TableCell>
                <TableCell align="left">
                {device.location != null ? device.location.map.id : void 0}</TableCell>
                <TableCell align="left"><DeviceControls onDelete={this.handleDeleteButton} onEdit={this.handleEditButton}/></TableCell>
                <MaterialDialogForm 
                    title="Edit Static Device"
                    open={this.state.open} 
                    onClose={this.handleClose} 
                    aria_id="Edit-Devices"
                    onChange={this.handleChange}
                    rows={[
                      {key: 'id', type: 'text', label: 'id', defaultValue: device.id, readOnly: true},
                      {key: 'anchorId', type: 'text', label: 'anchorId', defaultValue: device.anchor.id, readOnly: true},
                      {key: 'sensitivity', type: 'text', label: 'sensitivity', defaultValue: device.anchor.sensitivity},
                      {key: 'beaconId', type: 'text', label: 'beaconId', defaultValue: device.anchor.beaconId, readOnly: true},
                      {key: 'measuredPower', type: 'text', label: 'measuredPower', defaultValue: device.anchor.measuredPower},
                      {key: 'offset', type: 'text', label: 'offset', defaultValue: device.anchor.offset}
                    ]}
                    onSubmit={this.handleSubmit}    
                    
                    
                    
                />
            </TableRow>
        )
    }
}

export default withStyles(styles)(StaticDevicesTableRow)