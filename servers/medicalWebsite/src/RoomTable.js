import React from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import _ from 'underscore'
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
import Radio from '@material-ui/core/Radio';
import IconButton from '@material-ui/core/IconButton';
import Tooltip from '@material-ui/core/Tooltip';
import DeleteIcon from '@material-ui/icons/Delete';
import FilterListIcon from '@material-ui/icons/FilterList';
import AddIcon from '@material-ui/icons/Add'
import { lighten } from '@material-ui/core/styles/colorManipulator';
import { connect } from "react-redux";
import { assignBeacon, fetchDeviceLocations, fetchDevices, assignDevices, fetchRooms, assignRoom, editRoom} from "./actions/index";
import ConnectedAddDeviceForm from "./AddDeviceForm"
import axios from 'axios'
import RoomTableRow from './RoomTableRow'


const restUrlHTTPS = `http://137.132.165.139:3000/api`;
const graphqlUrlHTTPS = 'http://137.132.165.139:3000/graphql';

const mapDispatchToProps = dispatch => {
  return {
    assignBeacon: beacon => dispatch(assignBeacon(beacon)),
    assignDevices: devices => dispatch(assignDevices(devices)),
    assignRoom: room => dispatch(assignRoom(room)),
    fetchDevices: devices => dispatch(fetchDevices(devices)),
    fetchDeviceLocations: devices => dispatch(fetchDeviceLocations(devices)),
    fetchRooms: () => dispatch(fetchRooms()),
    editRoom: room => dispatch(editRoom(room))
  };
};

const mapStateToProps = state => {
  return {
    patients: state.patients,
    deviceLogs: state.deviceLogs,
    edit: state.edit,
    devices: state.devices,
    rooms: state.rooms,
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
  { id: 'Room', numeric: false, disablePadding: true, label: 'Room' },
  { id: 'Vacancy', numeric: false, disablePadding: true, label: 'Vacancy' }

];

class EnhancedTableHead extends React.Component {
  createSortHandler = property => event => {
    this.props.onRequestSort(event, property);
  };

  render() {
    const { onSelectAllClick, order, orderBy, numSelected, rowCount, headers } = this.props;

    return (
      <TableHead>
        <TableRow>
          <TableCell padding="checkbox">
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
            Available Rooms
          </Typography>,
          <Typography variant="caption" id="tableSubtitle">
            Mandatory
          </Typography>
        ]
        )}
      </div>
      <div className={classes.spacer} />
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

class RoomTable extends React.Component {
  state = {
    order: 'asc',
    orderBy: 'serialno',
    selected: [],
    data: [],
    page: 0,
    rowsPerPage: 6,
    open: false,
  };

  componentDidMount() {
    this.props.fetchRooms()
    
    // console.log (this.props.edit)
    // this.getDevices();
    //this.timer = setInterval(()=> this.getDeviceLogs(), 1000);
    if(this.props.edit != "") {
      let selected = this.props.edit.room;
      if (selected != null && selected[0] != "None") {
        this.props.assignRoom( selected )
        this.setState({selected: selected})
      }
      this.setState({edit: true})
    }
  }

  componentDidUpdate(prevProps) {
      if (!_.isEqual(prevProps.rooms, this.props.rooms)) {
          var data = this.createData(this.props.rooms)
          this.setState({data})
      }
      if(this.state.edit == true && this.props.edit == "") {
              this.setState({selected : []})
              this.props.assignRoom( ["None"] )
              this.setState({edit : false})
        }
      
  }

  request = ({query, variables}) => {
    let promise = axios({
      method:   'post',
      url:      `${graphqlUrlHTTPS}`,
      headers:  {'Content-Type': 'application/json'},
      data:     JSON.stringify({query, variables})
    })
    return promise;
  }

  getDevices = (dispatch) => {
    let query = `
      query {
        devices {
          id
          type
          location
          anchor {
            id
            device {
              id
            }
            sensitivity
          }
          beacon {
            id
            device {
              id
            }
            measuredPower
          }
          gatt {
            id
            device {
              id
            }
            profile
            connect
          }
        }
      }
    `
    this.request({query})
    .then (data =>
      this.props.fetchDevices(data.data.data.devices),
    )
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

//   componentDidUpdate(prevProps) {
//     if(this.props.devices !== prevProps.devices) {
//       this.filterLogs()
//     }
//     if(this.state.edit == true && this.props.edit == "") {
//       this.setState({selected : []})
//       this.props.assignDevices( ["None"] )
//       this.setState({edit : false})
//     }
//   }

  filterLogs = () => {
    let filteredLogs = this.props.devices
    let mobileDevices = []
    filteredLogs.map(device => {
      let checkBeacon = false
      this.props.patients.forEach(patient => {
        if(patient.devices[0] != "None") {
          patient.devices.map(check => {
            if(check.id == device.id) {
              checkBeacon = true
            }
          })
        }
      })

      if(checkBeacon == false && device.gatt != null) {
        mobileDevices.push(device)

      }

      if(checkBeacon == true && this.props.edit.devices != null) {
        this.props.edit.devices.map(check => {
          if(check.id == device.id) {
            mobileDevices.push(device)
          }
        })
      }
    })

    mobileDevices = this.createData(mobileDevices)
    this.setState({data: mobileDevices})

  }

  createData = (rooms) => {
    let data = []
    let counter = 0
    rooms.forEach(room => {
      let item = {id: counter, roomNo: room.id, vacancy: room.vacancy }
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

  handleClick = (event, id, roomNo, vacancy) => {
    const { selected } = this.state;
    const { assignRoom, editRoom } = this.props;
    let length = 0
    let selectedIndex = selected.indexOf(id);
    if(selectedIndex === -1) {
      let index = 0
      selected.map(check => {
        if(typeof check === 'object') {
          if(id == check.id) {
            selectedIndex = index
          }
        }
        index += 1
      })
    }
    //  selectedIndex = selected.indexOf(serialno)
    let newSelected = [];
    
    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
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
    if(newSelected.length > 0) {
      length = newSelected.length
      let data = this.state.data;
      let chosen = []
      newSelected.map(select => {
        if(typeof select === 'object'  | select == "None") {
          chosen.push(select)
        } else {
          let item = {id: data[select].roomNo, vacancy: data[select].vacancy-1}
          chosen.push(item)
        }
      })
      editRoom(chosen[0]);
      assignRoom(chosen);
    }
    else if (newSelected.indexOf(id) == -1) {
      let data = this.state.data;
      let chosen = []
      let item = {id: data[id].roomNo, vacancy: data[id].vacancy+1}
      chosen.push(item)
      editRoom(chosen[0]);
    }
      
    
    
    
    //   this.props.assignDevices( chosen );

    // } else {
    //   let chosenBeacon = ["None"]
    //   this.props.assignDevices( chosenBeacon );

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
    const { classes, rooms } = this.props;
    const { data, order, orderBy, selected, rowsPerPage, page } = this.state;
    const emptyRows = 0
    const headers = ['Room', 'Vacancy'];
    console.log (this.isSelected)
    return (
      <Paper className={classes.root}>
        {/* <ConnectedAddDeviceForm open={this.state.open} handleClose={this.handleClose} /> */}
        <EnhancedTableToolbar numSelected={selected.length}  handleOpen={this.handleOpen}/>
        <div className={classes.tableWrapper}>
          <Table className={classes.table} aria-labelledby="tableTitle">
            <EnhancedTableHead
              numSelected={selected.length}
              order={order}
              orderBy={orderBy}
              // onSelectAllClick={this.handleSelectAllClick}
              onRequestSort={this.handleRequestSort}
              rowCount={7}
            />
            <TableBody>
            { data ? stableSort(data, getSorting(order, orderBy))
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map(n => {
                  let isSelected = this.isSelected(n.id);
                  if(isSelected == false) {
                    this.state.selected.map(check => {
                      if(typeof check === 'object') {
                        if(n.id == check.id) {
                          isSelected = true
                        }
                      }
                    })

                  }
      

                  return (
                    <TableRow
                      hover
                      onClick={event => this.handleClick(event, n.id, n.roomNo, n.vacancy)}
                      role="checkbox"
                      aria-checked={isSelected}
                      tabIndex={-1}
                      key={n.id}
                      selected={isSelected}
                    >
                      <TableCell style={{width: '1.5rem'}}>
                        <Radio checked={isSelected} />
                      </TableCell>
                      <TableCell component="th" scope="row" padding="none">
                        {n.id + 1}
                      </TableCell>
                      <TableCell component="th" scope="row" padding="none">
                        {n.vacancy}
                      </TableCell>
                      {/*<TableCell padding="default">{n.battery}</TableCell>*/}
                    </TableRow>
                  );
                }) : void 0 }
              {emptyRows > 0 && (
                <TableRow>
                  <TableCell colSpan={6} />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        {/* <TablePagination
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
        /> */}
      </Paper>
    );
  }
}

RoomTable.propTypes = {
  classes: PropTypes.object.isRequired,
};

const AvailableRoomTable = connect(mapStateToProps, mapDispatchToProps)(RoomTable);

export default withStyles(styles)(AvailableRoomTable);
