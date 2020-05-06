import React from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TablePagination from '@material-ui/core/TablePagination';
import TableRow from '@material-ui/core/TableRow';
import TableSortLabel from '@material-ui/core/TableSortLabel';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Paper from '@material-ui/core/Paper';
import Checkbox from '@material-ui/core/Checkbox';
import IconButton from '@material-ui/core/IconButton';
import Tooltip from '@material-ui/core/Tooltip';
import DeleteIcon from '@material-ui/icons/Delete';
import FilterListIcon from '@material-ui/icons/FilterList';
import AddIcon from '@material-ui/icons/Add'
import { lighten } from '@material-ui/core/styles/colorManipulator';
import { connect } from "react-redux";
import { assignBeacon, fetchDeviceLocations } from "./actions/index";
import ConnectedAddDeviceForm from "./AddDeviceForm"
import axios from 'axios'


const restUrlHTTPS = `http://137.132.165.139:3000/api`;

const mapDispatchToProps = dispatch => {
  return {
    assignBeacon: beacon => dispatch(assignBeacon(beacon)),
    fetchDeviceLocations: devices => dispatch(fetchDeviceLocations(devices)),
  };
};

const mapStateToProps = state => {
  return {
    patients: state.patients,
    assets: state.assets,
    staff: state.staff,
    deviceLogs: state.deviceLogs,
    edit: state.edit,
    beacon: state.beacon,
  };
};



let counter = 0;
function createData(serialno, battery) {
  counter += 1;
  return { id: counter, serialno, battery };
}

function desc(a, b, orderBy) {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

function stableSort(array, cmp) {
  const stabilizedThis = array.map((el, index) => [el, index]);
  stabilizedThis.sort((a, b) => {
    const order = cmp(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });
  return stabilizedThis.map(el => el[0]);
}

function getSorting(order, orderBy) {
  return order === 'desc' ? (a, b) => desc(a, b, orderBy) : (a, b) => -desc(a, b, orderBy);
}

// { id: 'battery', numeric: false, disablePadding: false, label: 'Battery Life (%)' },
const rows = [
  { id: 'serialno', numeric: false, disablePadding: true, label: 'Serial No' },

];

class EnhancedTableHead extends React.Component {
  createSortHandler = property => event => {
    this.props.onRequestSort(event, property);
  };

  render() {
    const { onSelectAllClick, order, orderBy, numSelected, rowCount } = this.props;

    return (
      <TableHead>
        <TableRow>
          <TableCell padding="checkbox">
            {/*<Checkbox
              indeterminate={numSelected > 0 && numSelected < rowCount}
              checked={numSelected === rowCount}
              onChange={onSelectAllClick}
            /> */}
          </TableCell>
          {rows.map(row => {
            return (
              <TableCell
                key={row.id}
                numeric={row.numeric}
                padding={row.disablePadding ? 'none' : 'default'}
                sortDirection={orderBy === row.id ? order : false}
              >
                <Tooltip
                  title="Sort"
                  placement={row.numeric ? 'bottom-end' : 'bottom-start'}
                  enterDelay={300}
                >
                  <TableSortLabel
                    active={orderBy === row.id}
                    direction={order}
                    onClick={this.createSortHandler(row.id)}
                  >
                    {row.label}
                  </TableSortLabel>
                </Tooltip>
              </TableCell>
            );
          }, this)}
        </TableRow>
      </TableHead>
    );
  }
}

EnhancedTableHead.propTypes = {
  numSelected: PropTypes.number.isRequired,
  onRequestSort: PropTypes.func.isRequired,
  onSelectAllClick: PropTypes.func.isRequired,
  order: PropTypes.string.isRequired,
  orderBy: PropTypes.string.isRequired,
  rowCount: PropTypes.number.isRequired,
};

const toolbarStyles = theme => ({
  root: {
    paddingRight: theme.spacing.unit,
  },
  highlight:
    theme.palette.type === 'light'
      ? {
          color: theme.palette.secondary.main,
          backgroundColor: lighten(theme.palette.secondary.light, 0.85),
        }
      : {
          color: theme.palette.text.primary,
          backgroundColor: theme.palette.secondary.dark,
        },
  spacer: {
    flex: '1 1 100%',
  },
  actions: {
    color: theme.palette.text.secondary,
  },
  title: {
    paddingTop: '.5em',
    flex: '0 0 auto',
  },
});

class EnhancedTableToolbar extends React.Component {

handleOpen = () => {
  this.props.handleOpen()
}
render() {
  const { numSelected, classes } = this.props;

  return (
    <Toolbar
      className={classNames(classes.root, {
        [classes.highlight]: numSelected > 0,
      })}
    >
      <div className={classes.title}>
        {numSelected > 0 ? (
          <Typography color="inherit" variant="subtitle1">
            {numSelected} selected
          </Typography>
        ) : ([
          <Typography variant="h6" id="tableTitle">
            Available Beacons
          </Typography>,
          <Typography variant="caption" id="tableSubtitle">
            Optional
          </Typography>
        ]
        )}
      </div>
      <div className={classes.spacer} />
      <div className={classes.actions}>
        {numSelected > 0 ? (
          null
        ) : (
          <Tooltip title="Add Beacon">
            <IconButton aria-label="Add" onClick={this.handleOpen}>
              <AddIcon />
            </IconButton>
          </Tooltip>
        )}
      </div>
    </Toolbar>
  );
}
};

EnhancedTableToolbar.propTypes = {
  classes: PropTypes.object.isRequired,
  numSelected: PropTypes.number.isRequired,
};

EnhancedTableToolbar = withStyles(toolbarStyles)(EnhancedTableToolbar);

const styles = theme => ({
  root: {
    width: '100%',
    marginTop: theme.spacing.unit * 3,
  },
  table: {
    minWidth: 500,
  },
  tableWrapper: {
    overflowX: 'auto',
  },
});

class BeaconTable extends React.Component {
  state = {
    order: 'asc',
    orderBy: 'serialno',
    selected: [],
    data: [
    ],
    page: 0,
    rowsPerPage: 5,
    open: false,
  };

  componentDidMount() {
    this.timer = setInterval(()=> this.getDeviceLogs(), 1000);
    if(this.props.edit != "") {
      let selected = this.props.edit.beacon;
      if (selected != null && selected != "None") {
        this.props.assignBeacon( selected )
        this.setState({selected: [selected]})
      }
      this.setState({edit: true})
    }
  }

  getDeviceLogs = (dispatch) => {
    let promise = axios({
      method:   'get',
      url:      `${restUrlHTTPS}/Devices/logs`,
      headers:  {'Content-Type': 'application/json'},
    }).then (data => {
        this.props.fetchDeviceLocations(data.data)
      }
    )
    return promise;
  }

  componentWillUnmount() {
    clearInterval(this.timer)
    this.timer = null; // here...
  }

  componentDidUpdate(prevProps) {
    if(this.props.beacon != prevProps.beacon) {
      this.setState({selected: this.props.beacon})
      this.forceUpdate()
    }
    if(this.props.deviceLogs !== prevProps.deviceLogs) {
      this.filterLogs()
    }
    if(this.state.edit == true && this.props.edit == "") {
      this.setState({selected : []})
      this.props.assignBeacon( "None" )
      this.setState({edit : false})
    }
  }

  filterLogs = () => {
    let filteredLogs = this.props.deviceLogs
    let mobileDevices = []
    filteredLogs.map(device => {
      let checkBeacon = false
      this.props.patients.forEach(patient => {
        if(device.id == patient.beacon) {
          checkBeacon = true
        }
      })

      this.props.assets.forEach(asset => {
        if(device.id == asset.beacon) {
          checkBeacon = true
        }
      })

      this.props.staff.forEach(staff => {
        if(device.id == staff.beacon) {
          checkBeacon = true
        }
      })
      if(checkBeacon == false && device.id.charAt(0) == 'b') {
        mobileDevices.push(device)

      }

      if(checkBeacon == true && this.props.edit.beacon == device.id) {
        mobileDevices.push(device)
      }
    })

    mobileDevices = this.createData(mobileDevices)
    this.setState({data: mobileDevices})

  }

  createData = (devices) => {
    let data = []
    let counter = 0
    devices.forEach(device => {
      let item = {id: counter, serialno: device.id }
      data.push(item)
      counter += 1;
    })

    return data;
  }

  handleRequestSort = (event, property) => {
    const orderBy = property;
    let order = 'desc';

    if (this.state.orderBy === property && this.state.order === 'desc') {
      order = 'asc';
    }

    this.setState({ order, orderBy });
  };

  handleSelectAllClick = event => {
    if (event.target.checked) {
      this.setState(state => ({ selected: state.data.map(n => n.id) }));
      return;
    }
    this.setState({ selected: [] });
  };

  handleClick = (event, id, serialno) => {
    const { selected } = this.state;
    let selectedIndex = selected.indexOf(id);
    if(selectedIndex === -1)
      selectedIndex = selected.indexOf(serialno)
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected[0] = id;
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1),
      );
    }

    this.setState({ selected: newSelected });
    if(newSelected.length === 1) {
      let data = this.state.data;
      let chosenBeacon = [data[newSelected[0]].serialno]

      this.props.assignBeacon( chosenBeacon );

    } else {
      let chosenBeacon = []
      this.props.assignBeacon( chosenBeacon );
    }

  };

  handleChangePage = (event, page) => {
    this.setState({ page });
  };

  handleChangeRowsPerPage = event => {
    this.setState({ rowsPerPage: event.target.value });
  };

  handleOpen = () => {
    this.setState({open: true})
  }

  handleClose = () => {
    this.setState({open: false})
  }



  isSelected = id => this.state.selected.indexOf(id) !== -1;

  render() {
    const { classes } = this.props;
    const { data, order, orderBy, selected, rowsPerPage, page } = this.state;
    const emptyRows = rowsPerPage - Math.min(rowsPerPage, data.length - page * rowsPerPage);

    return (
      <Paper className={classes.root}>
        <ConnectedAddDeviceForm open={this.state.open} handleClose={this.handleClose} />
        <EnhancedTableToolbar numSelected={selected.length}  handleOpen={this.handleOpen}/>
        <div className={classes.tableWrapper}>
          <Table className={classes.table} aria-labelledby="tableTitle">
            <EnhancedTableHead
              numSelected={selected.length}
              order={order}
              orderBy={orderBy}
              onSelectAllClick={this.handleSelectAllClick}
              onRequestSort={this.handleRequestSort}
              rowCount={data.length}
            />
            <TableBody>
              {stableSort(data, getSorting(order, orderBy))
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map(n => {
                  let isSelected = this.isSelected(n.id);
                  if(isSelected == false) {
                    isSelected = this.isSelected(n.serialno)
                  }

                  return (
                    <TableRow
                      hover
                      onClick={event => this.handleClick(event, n.id, n.serialno)}
                      role="checkbox"
                      aria-checked={isSelected}
                      tabIndex={-1}
                      key={n.id}
                      selected={isSelected}
                    >
                      <TableCell style={{width: '1.5rem'}} padding="checkbox">
                        <Checkbox checked={isSelected} />
                      </TableCell>
                      <TableCell component="th" scope="row" padding="none">
                        {n.serialno}
                      </TableCell>
                      {/*<TableCell padding="default">{n.battery}</TableCell>*/}
                    </TableRow>
                  );
                })}
              {emptyRows > 0 && (
                <TableRow style={{ height: 49 * emptyRows }}>
                  <TableCell colSpan={6} />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <TablePagination
          component="div"
          count={data.length}
          rowsPerPage={rowsPerPage}
          page={page}
          rowsPerPageOptions={[5, 10, 15]}
          backIconButtonProps={{
            'aria-label': 'Previous Page',
          }}
          nextIconButtonProps={{
            'aria-label': 'Next Page',
          }}
          onChangePage={this.handleChangePage}
          onChangeRowsPerPage={this.handleChangeRowsPerPage}
        />
      </Paper>
    );
  }
}

BeaconTable.propTypes = {
  classes: PropTypes.object.isRequired,
};

const ConnectedBeaconTable = connect(mapStateToProps, mapDispatchToProps)(BeaconTable);

export default withStyles(styles)(ConnectedBeaconTable);
