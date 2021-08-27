import React, { Component } from 'react';
import AppBar from '@material-ui/core/AppBar';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import Toolbar from '@material-ui/core/Toolbar';
import { withStyles } from '@material-ui/core/styles';
import _ from 'underscore'
import { connect } from "react-redux";
import { confirmType, addPatient, fetchMaps, editPatient, updatePatient, fetchPatientCount, updatePatientCount, removePatient, signOutUser, assignBeacon, assignDevices, assignRoom, editRoom, fetchRooms } from "./actions/index";
import Card from '@material-ui/core/Card';
import CircularProgress from '@material-ui/core/CircularProgress';
import TemporaryDrawer from './TemporaryDrawer';
import IconButton from '@material-ui/core/IconButton';
import MenuIcon from '@material-ui/icons/Menu';
import AddIcon from '@material-ui/icons/Add';
import AccountCircle from '@material-ui/icons/AccountCircle';
import MenuItem from '@material-ui/core/MenuItem';
import Menu from '@material-ui/core/Menu';
import FormControl from '@material-ui/core/FormControl';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import classNames from 'classnames';
import InputAdornment from '@material-ui/core/InputAdornment';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormLabel from '@material-ui/core/FormLabel';
import BeaconTable from './BeaconTable';
import DevicesTable from './DevicesTable';
import Scanner from './Scanner';
import Result from './Result';
import Select from 'react-select';
import axios from 'axios';
import NoSsr from '@material-ui/core/NoSsr';
import Paper from '@material-ui/core/Paper';
import Chip from '@material-ui/core/Chip';
import CancelIcon from '@material-ui/icons/Cancel';
import ClickAwayListener from '@material-ui/core/ClickAwayListener';
import { fakeDataRef } from "./firebase/index"
import LinearProgress from '@material-ui/core/LinearProgress';
import AvailableRoomTable from './RoomTable';
import AnchorsTable from './AnchorsTable';

const graphqlUrlHTTPS = 'http://137.132.165.139:3000/graphql';


const styles = theme => ({
  container: {
    display: 'flex',
    flexWrap: 'wrap',
  },
  root: {
    flexGrow: 1,
  },
  grow: {
    flexGrow: 1,
  },
  card: {
    minWidth: 275,
    padding: '2rem'
  },
  textField: {
    // marginLeft: theme.spacing.unit,
    // marginRight: theme.spacing.unit,
  },
  borderBox: {
    border: '1px solid',
    padding: '2rem',
    borderRadius: '16px',
  },
  menu: {
    width: 200,
  },
  menuButton: {
    marginLeft: -12,
    marginRight: 20,
    opacity : 0.4,
    color: 'black',
  },
  align: {
    padding: `${theme.spacing.unit * 2}px ${theme.spacing.unit * 3}px ${theme.spacing.unit * 3}px`,
  },
  input: {
    display: 'flex',
    padding: 0,
  },
  valueContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    flex: 1,
    alignItems: 'center',
    overflow: 'hidden',
    padding: '18.5px 14px',
  },
  noOptionsMessage: {
   padding: `${theme.spacing.unit}px ${theme.spacing.unit * 2}px`,
 },
 singleValue: {
    fontSize: 16,
  },
  placeholder: {
    position: 'absolute',
    left: 2,
    fontSize: 16,
    padding: '18.5px 14px',
  },
  paper: {
    position: 'absolute',
    zIndex: 1,
    marginTop: theme.spacing.unit,
    left: 0,
    right: 0,
  },
  error: {
    borderColor: 'red !important',
  }
});

const mapStateToProps = state => {
  return {
    beacon: state.beacon,
    maps: state.maps,
    edit: state.edit,
    devices: state.assignDevices,
    room: state.assignRoom,
    isAuthenticating: state.isAuthenticating,
    authenticated: state.authenticated,
    patientCounter: state.patientCounter,
    staticDevices: state.staticDevices,
    rooms: state.rooms
   };
};

const mapDispatchToProps = dispatch => {
  return {
    confirmType: type => dispatch(confirmType(type)),
    addPatient: patient => dispatch(addPatient(patient)),
    assignDevices: devices => dispatch(assignDevices(devices)),
    assignRoom: room => dispatch(assignRoom(room)),
    editRoom: room => dispatch(editRoom(room)),
    editPatient: patient => dispatch(editPatient(patient)),
    removePatient: patient => dispatch(removePatient(patient)),
    fetchMaps: maps => dispatch(fetchMaps(maps)),
    assignBeacon: beacon => dispatch(assignBeacon(beacon)),
    signOutUser: credentials => dispatch(signOutUser(credentials)),
    fetchPatientCount: count => dispatch(fetchPatientCount(count)),
    updatePatientCount: count => dispatch(updatePatientCount(count)),
    updatePatient: patient => dispatch(updatePatient(patient)),
    fetchRooms: () => dispatch(fetchRooms()),
    // AssignAnchorToRoom: room => dispatch(AssignAnchorToRoom(room)),
  };
};

function NoOptionsMessage(props) {
  return (
    <Typography
      color="textSecondary"
      className={props.selectProps.classes.noOptionsMessage}
      {...props.innerProps}
    >
      {props.children}
    </Typography>
  );
}

function inputComponent({ inputRef, ...props }) {
  return <div ref={inputRef} {...props} />;
}

function Control(props, state) {
  return (
    <TextField
      fullWidth
      variant="outlined"
      style={{borderColor: 'red !important'}}
      InputProps={{
        inputComponent,
        inputProps: {
          className: props.selectProps.classes.input,
          inputRef: props.innerRef,
          children: props.children,
          ...props.innerProps,
        },
      }}
      required={true}
      error={props.selectProps.error}
      helperText={ props.selectProps.error ? "This field is required" : null}
      {...props.selectProps.textFieldProps}
    />
  );
}

function Option(props) {
  return (
    <MenuItem
      buttonRef={props.innerRef}
      selected={props.isFocused}
      component="div"
      style={{
        fontWeight: props.isSelected ? 500 : 400,
      }}
      {...props.innerProps}
    >
      {props.children}
    </MenuItem>
  );
}

function Placeholder(props) {
  return (
    <Typography
      color="textSecondary"
      className={props.selectProps.classes.placeholder}
      {...props.innerProps}
    >
      {props.children}
    </Typography>
  );
}

function SingleValue(props) {
  return (
    <Typography className={props.selectProps.classes.singleValue} {...props.innerProps}>
      {props.children}
    </Typography>
  );
}

function ValueContainer(props) {
  return <div className={props.selectProps.classes.valueContainer}>{props.children}</div>;
}

function MultiValue(props) {
  return (
    <Chip
      tabIndex={-1}
      label={props.children}
      className={classNames(props.selectProps.classes.chip, {
        [props.selectProps.classes.chipFocused]: props.isFocused,
      })}
      onDelete={props.removeProps.onClick}
      deleteIcon={<CancelIcon {...props.removeProps} />}
    />
  );
}

function SubMenu(props) {
  return (
    <Paper square className={props.selectProps.classes.paper} {...props.innerProps}>
      {props.children}
    </Paper>
  );
}

const components = {
  Control,
  SubMenu,
  MultiValue,
  NoOptionsMessage,
  Option,
  Placeholder,
  SingleValue,
  ValueContainer,
};

class AssignAnchors extends Component {
  constructor(props) {
    super(props);

    this.state = {
      anchorEl: null,
      auth: true,
      name: "",
      age: "",
      race: "",
      gender: "",
      ward: "",
      type: "Patient",
      beacon: this.props.beacon,
      scanning: false,
      results: [],
      options: [],
      edit: false,
      editSuccess: false,
      nameError: false,
      room: "",
      roomData: "",
      unassignedAnchors: "",
      roomInfo: [],
    };
  }

  componentWillUnmount() {
    if(this.state.editSuccess == false) {
      this.props.editPatient('')
    }
  }
  componentDidMount() {
    const { fetchRooms } = this.props;
    this.fetch();
    fetchRooms()
    this.props.fetchPatientCount();
    if(this.props.edit != "" && this.props.edit != null) {
      let edit = this.props.edit;
      this.setState({
        name: edit.name,
        age: edit.age,
        race: edit.race,
        gender: edit.gender,
        ward: {value: edit.ward, label: edit.ward},
        room: edit.room,
        edit: true,
      })
    } else {
      this.flushData()
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (!_.isEqual(prevProps.rooms, this.props.rooms)) {
        var roomData = this.createData(this.props.rooms)
        var unassignedAnchors = this.unassignedAnchors(this.props.rooms, this.props.staticDevices)
        this.setState({roomData})
        this.setState({unassignedAnchors})
    }
    if(this.state.edit == true && this.props.edit == "") {
      this.flushData()
    }

    if(this.props.isAuthenticating == false && this.props.authenticated == false) {
      this.props.history.push('/');
    }
  }

  flushData = () => {
    this.setState({
      name: "",
      age: "",
      race: "",
      gender: "",
      ward: "",
      room: "",
      edit: false,
    })

    let chosen = ""
    this.props.assignBeacon( chosen );
  }

  createData = (rooms, anchors) => {
    let data = []
    let counter = 0
    rooms.forEach(room => {
      let item = {id: counter, roomNo: room.id, vacancy: room.vacancy, devices: room.devices ? room.devices : [], anchors: room.anchors ? room.anchors : [] }
      data.push(item)
      counter += 1
    })
    return data
  }

  unassignedAnchors = (rooms, anchors) => {
    let data = []
    let isAssigned = null
    anchors.forEach(anchor => {
        rooms.some(room => {
            isAssigned = room.anchors == anchor.id ? true : false
            if (isAssigned) return true;
        })
        let item = isAssigned == false ? anchor.id : void 0
        if (item != undefined) {
            if (item.includes("rpi")) {
                data.push(item)
            }
        }
    })
    return data
  }

  createOptions = (maps) => {

    let options = maps.map((map) => (
      {
      value: map.id,
      label: map.id,
    }))

    this.setState({options})
  }

  fetch = (dispatch) => {
    let query = `
      query {
        maps {
          id
          scale
          coordinates
          imageURL
          navMesh
          navPath
          pois
        }
      }
    `
    this.request({query})
    .then (data => {
      this.props.fetchMaps(data.data.data.maps);
      this.createOptions(data.data.data.maps);
    })
  }

  crossReferenceData = (result) => {
    fakeDataRef.on("value", snapshot => {

    let fullShot = snapshot.val()

    for (const key of Object.keys(fullShot)) {

      if(key == result.codeResult.code) {
        let name = fullShot[key].name
        let race = fullShot[key].race
        let age = fullShot[key].age
        let gender = fullShot[key].gender

        this.setState({name, gender, race, age})
        this.forceUpdate()
      }
    }
    });
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

  toggleDrawer = () => {
    this.setState({ drawer: true});
  }

  toggleCloseDrawer = () => {
    this.setState({ drawer: false });
  }

  handleMenu = event => {
    this.setState({ drawer: false });
    this.setState({ anchorEl: event.currentTarget });
  };

  handleClose = () => {
    this.setState({ drawer: false });
    this.setState({ anchorEl: null });
  };

  handleSubmit = (e) => {
    // const { AssignAnchorToRoom } = this.props
    e.preventDefault();
    // this.state.roomInfo.forEach(room => {
    //   AssignAnchorToRoom(room)
    // })
    this.props.history.push('/AnchorInfo')
    // AssignAnchorToRoom(this.state.roomInfo)
    // this.handleClose()
    // let errorCheck = false
    // const { type } = this.state;
    // if(this.state.name == "") {
    //   this.setState({nameError: true})
    //   errorCheck = true
    // }

    // if(this.state.ward.value == null) {
    //   this.setState({wardError: true})
    //   errorCheck = true
    // }

    // let devices = this.props.devices
    // let room = this.props.room
    // if(devices != null) {
    //   if(devices[0] != "None" && devices.length > 0) {
    //     let imuCount = 0
    //     let ecgCount = 0
    //     let hrCount = 0
    //     devices.map(device => {
    //       if(device.id.charAt(0) == 'e') {
    //         ecgCount += 1
    //       }

    //       if(device.id.charAt(0) == 'h') {
    //         hrCount += 1
    //       }
    //       if(device.id.charAt(0)== 'i') {
    //         imuCount += 1
    //       }
    //     })

    //     if(imuCount > 1 | ecgCount > 1 | hrCount > 1) {
    //       errorCheck = true
    //     }
    //   }
    // }
    // if(errorCheck)
    //   return

    // if(devices == null) {
    //   devices = ["None"]
    // }
    // let patient = {
    //   name: this.state.name,
    //   age: this.state.age,
    //   race: this.state.race,
    //   gender: this.state.gender,
    //   ward: this.state.ward.value,
    //   room: room ? room: "",
    //   beacon: this.props.beacon,
    //   devices: devices,
    //   highlight: true,
    // }
    // let confirm = {
    //   name: this.state.name,
    //   age: this.state.age,
    //   race: this.state.race,
    //   gender: this.state.gender,
    //   ward: this.state.ward.value,
    //   room: room,
    //   beacon: this.props.beacon,
    //   devices: devices,
    //   type: type}
    //   if(this.state.edit) {
    //     patient.id = this.props.edit.id
    //     this.props.updatePatient(patient)
    //     this.props.editRoom(room)
    //     this.setState({editSuccess: true})
    //   } else {
    //     this.props.updatePatientCount(this.props.patientCounter.count)
    //     this.props.addPatient(patient);
    //   }

    // this.props.confirmType({ confirm })


    // let chosenBeacon = "None"
    // let chosen = ["None"]
    // this.props.assignBeacon( chosenBeacon );
    // this.props.assignDevices(chosen);
    // this.props.history.push('/addConfirmation');

  }

  handleLoading = () => {
    this.setState(state => ({
      loading: !state.loading,
    }))
  }
  removePatient = () => {
    this.props.removePatient(this.props.edit)
    this.props.history.push('/locationTracking')
  }
  handleLogOut = () => {
    this.handleClose()
    this.props.signOutUser()
  }

  handleChange = (e, item, anchor) => {
    // this.state.roomInfo[anchor] = item
    let temp = {id:"room" + item, anchor: anchor}
    this.state.roomInfo.push(temp)
    // console.log (item, anchor)
    // this.state.roomInfo[anchor] = item
    // this.setState({ item: e.target.value })
  }

  cancel = () => {
    this.props.editPatient('')
    if(this.state.edit) {
      this.props.history.push('/locationTracking')
    } else
      this.props.history.push('/home');

  }

  _scan = () => {

        this.setState({scanning: !this.state.scanning});
    }

    _onDetected = (result) => {
        let results = this.state.results;
        if(results.indexOf(result) < 0) {
          this.setState({results: [result]});
          this.crossReferenceData(result)
          this._scan()
        }
    }


  render() {
    const { classes, theme, staticDevices } = this.props;
    const { anchorEl, auth, roomData, unassignedAnchors, roomInfo } = this.state;
    const open = Boolean(anchorEl)
    // console.log (roomInfo)
    const races = ['Chinese', 'Malay', 'Indian', 'Others'];
    const selectStyles = {
      input: base => ({
        ...base,
        color: theme.palette.text.primary,
        cursor: 'pointer',
        '& input': {
          font: 'inherit',
        },
      }),
    };

    if(this.props.isAuthenticating) {
      return <LinearProgress />
    } else
    return (
      <div className={classes.root}>
        <AppBar position="static" style={{boxShadow: "none", backgroundColor: "white"}}>
          <Toolbar>
            <IconButton className={classes.menuButton} color="inherit" aria-label="Menu" onClick={this.toggleDrawer}>
              <MenuIcon />
            </IconButton>
            <Typography variant="title" className={classes.grow} style={{color: "black"}}>
              Assign Anchors
            </Typography>
            {auth && (
                <div>
                  <IconButton
                    aria-owns={open ? 'menu-appbar' : null}
                    aria-haspopup="true"
                    onClick={this.handleMenu}
                    color="inherit"
                  >
                    <AccountCircle style={{color: "black"}} />
                  </IconButton>
                  <Menu
                    id="menu-appbar"
                    anchorEl={anchorEl}
                    anchorOrigin={{
                      vertical: 'top',
                      horizontal: 'right',
                    }}
                    transformOrigin={{
                      vertical: 'top',
                      horizontal: 'right',
                    }}
                    open={open}
                    onClose={this.handleClose}
                  >
                    <MenuItem onClick={this.handleLogOut}>Logout</MenuItem>
                  </Menu>
                </div>
              )}
          </Toolbar>
        </AppBar>
        <ClickAwayListener onClickAway={this.toggleCloseDrawer}>
          <TemporaryDrawer toggle={this.state.drawer} />
        </ClickAwayListener>
        <form className={classes.align} onSubmit={this.handleSubmit}>
          <Grid container
            direction="column"
            spacing={0}
            alignItems="center"
            style={{ minHeight: '75vh'}}>
            <Grid item xs={12}>
              <div className={classes.layout}>
              <Grid container>
                <Grid item xs={6}>
                  <Typography variant="h4" gutterBottom>Anchors</Typography>
                </Grid>
              </Grid>
            </div>
            <Grid container
              direction="row"
              spacing={0}
              alignItems="center"
            >
              <Grid item xs={12}>
                <AnchorsTable anchors={unassignedAnchors} rooms={roomData} onChange={this.handleChange} />
              </Grid>
            </Grid>

            <br/>
            <div style={{ textAlign: 'center', paddingTop: '1rem'}}>
              <Button type='submit' variant="contained" color="primary">
                Submit
              </Button>
              <Button style={{marginLeft: '3em'}} onClick={this.cancel}>
                Cancel
              </Button>
            </div>
            </Grid>
          </Grid>
        </form>
      </div>

    )

  }
}

const ConnectedAssignAnchors = connect(mapStateToProps, mapDispatchToProps)(AssignAnchors);

export default withStyles(styles, {withTheme: true})(ConnectedAssignAnchors);
