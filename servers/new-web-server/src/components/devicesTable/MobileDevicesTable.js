import React, { Component } from 'react'
import Button from '@material-ui/core/Button'
import { withStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import MobileDevicesTableRow from './MobileDevicesRow'
import AddIcon from '@material-ui/icons/Add'
import MaterialDialogForm from '../addDevices/MaterialDialogForm'


const styles = theme => ({
    root: {
      width: '100%',
      marginTop: theme.spacing.unit,
      overflowX: 'auto',
    },
    table: {
      minWidth: 700,
    },
    button: {
      margin: theme.spacing.unit,
    },
    leftIcon: {
      marginLeft: theme.spacing.unit,
    },
    textField: {
      marginLeft: theme.spacing.unit,
      marginRight: theme.spacing.unit,
    },
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
      if (gattId != '') {
        device.gatt = {
          id: gattId
        };
      }
        if (gattProfile != '') {
            device.gatt.profile = JSON.parse(gattProfile);
        }
  }
  return device;
}

class MobileDevicesTable extends Component {
  state = {
    open: false,
    id: '',
    beaconId: '',
    measuredPower: -60,
    gattId: '',
    gattProfile: ''
  };

  handleClickOpen = () => {
    this.setState({ open: true });
  };

  handleClose = () => {
      this.setState({ open: false });
  };

  handleChange = (e) => {
    this.setState({
        [e.target.id] : e.target.value
    })
  }

  handleSubmit = (e) => {
    e.preventDefault();
    const device = {
        id: this.state.id,
        beaconId: this.state.beaconId,
        measuredPower: this.state.measuredPower,
        gattId: this.state.gattId,
        gattProfile: this.state.gattProfile,
    }
    this.props.onCreate(packageDevice(device))
    // this.props.history.push('/Devices')
    this.setState({ open: false });
  }

  render() {
    const { classes, devices, onEdit, onDelete, onConnect } = this.props;
    const headers = ['id', 'beaconId', 'measuredPower', 'gattId', 'gattProfile', 'connect', 'actions']
    return(
      <div>
        <Button fullWidth={true} variant="outlined" size="medium" color="secondary" className={classes.button} onClick={this.handleClickOpen}>
          Add
        <AddIcon className={classes.leftIcon}/>
        </Button>
        <MaterialDialogForm 
          title="Create Mobile Device"
          open={this.state.open} 
          onClose={this.handleClose} 
          aria_id="Create-Devices"
          onChange={this.handleChange}
          rows={[
            {key: 'id', type: 'text', label: 'id', required: true},
            {key: 'beaconId', type: 'text', label: 'beaconId'},
            {key: 'measuredPower', type: 'text', label: 'measuredPower'},
            {key: 'gattId', type: 'text', label: 'gattId'},
            {key: 'gattProfile', type: 'text', label: 'gattProfile', maxRows: 5}
          ]}
          onSubmit={this.handleSubmit}
        />
        <Table className={classes.table}>
          <TableHead>
            <TableRow>
            {headers.map(header => 
                <TableCell>{header}</TableCell>)}
            </TableRow>
          </TableHead>
          <TableBody>
            {devices.map(device => (
              <MobileDevicesTableRow key={device.id} device={device} onEdit={onEdit} onDelete={onDelete} onConnect={onConnect}/>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }
}

export default withStyles(styles)(MobileDevicesTable)