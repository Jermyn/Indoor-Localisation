import React, { Component } from 'react'
import Button from '@material-ui/core/Button'
import { withStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import StaticDevicesTableRow from './StaticDevicesTableRow';
import AddIcon from '@material-ui/icons/Add'
import MaterialDialogForm from '../addDevices/MaterialDialogForm'


const styles = theme => ({
    root: {
      width: '100%',
      marginTop: theme.spacing.unit,
      overflowX: 'auto',
    },
    container: {
      display: 'flex',
      flexWrap: 'wrap',
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

class StaticDevicesTable extends Component {  
  state = {
    addDevicesOpen: false,
    id: '',
    anchorId: '',
    sensitivity: 0,
    beaconId: '',
    measuredPower: -60
  };

  handleClickOpen = () => {
    this.setState({ addDevicesOpen: true });
  };

  handleClose = () => {
      this.setState({ addDevicesOpen: false });
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
        anchorId: this.state.anchorId,
        sensitivity: this.state.sensitivity,
        beaconId: this.state.beaconId,
        measuredPower: this.state.measuredPower,
    }
    this.props.onCreate(packageDevice(device))
    // this.props.history.push('/Devices')
    this.setState({ addDevicesOpen: false });
}

  render() {
    const { classes, devices, onEdit, onDelete } = this.props;
    const headers = ['id', 'anchorId', 'sensitivity', 'beaconId', 'measuredPower', 'offset', 'location', 'actions'];
    return(
      <div>
        <Button fullWidth={true} variant="outlined" size="medium" color="secondary" className={classes.button} onClick={this.handleClickOpen}>
          Add
        <AddIcon className={classes.leftIcon}/>
        </Button>
        <MaterialDialogForm 
          title="Create Static Device"
          open={this.state.addDevicesOpen} 
          onClose={this.handleClose} 
          aria_id="Create-Devices"
          onChange={this.handleChange}
          rows={[
            {key: 'id', type: 'text', label: 'id', required: true},
            {key: 'anchorId', type: 'text', label: 'anchorId'},
            {key: 'sensitivity', type: 'text', label: 'sensitivity'},
            {key: 'beaconId', type: 'text', label: 'beaconId'},
            {key: 'measuredPower', type: 'text', label: 'measuredPower'},
            {key: 'offset', type: 'text', label: 'offset'}
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
              <StaticDevicesTableRow key={device.id} device={device} onEdit={onEdit} onDelete={onDelete}/>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }
}

export default withStyles(styles)(StaticDevicesTable)