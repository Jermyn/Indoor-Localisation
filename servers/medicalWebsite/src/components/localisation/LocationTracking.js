import React, { Component } from 'react';
import AppBar from '@material-ui/core/AppBar';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import Toolbar from '@material-ui/core/Toolbar';
import { withStyles } from '@material-ui/core/styles';
import { connect } from "react-redux";
// import { addUsername, fetchMaps, loadMap, fetchDevices, fetchEcgVitals, signOutUser, fetchHeartrateVitals, fetchSimulationCoordinates, highlightPatient, highlightAsset, highlightStaff, addPatient, loadInfo, removePatient,editPatient, fetchDeviceLocations } from "../../actions/index";
import Actions from '../../store/actions/actions'
import Card from '@material-ui/core/Card';
import CardMedia from '@material-ui/core/CardMedia';
import CardContent from '@material-ui/core/CardContent';
import CardActions from '@material-ui/core/CardActions';
import CircularProgress from '@material-ui/core/CircularProgress';
import TemporaryDrawer from '../../TemporaryDrawer';
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
// import BeaconTable from './BeaconTable';
import CameraIcon from '@material-ui/icons/PhotoCamera';
import DeleteIcon from '@material-ui/icons/Delete';
import BottomNavigation from '@material-ui/core/BottomNavigation';
import BottomNavigationAction from '@material-ui/core/BottomNavigationAction';
import MyLocationIcon from '@material-ui/icons/MyLocation';
import PersonPinIcon from '@material-ui/icons/PersonPin';
import LocationOnIcon from '@material-ui/icons/LocationOn';
import ClickAwayListener from '@material-ui/core/ClickAwayListener';
import Grow from '@material-ui/core/Grow';
import Paper from '@material-ui/core/Paper';
import Popper from '@material-ui/core/Popper';
import MenuList from '@material-ui/core/MenuList';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import Dialog from '@material-ui/core/Dialog';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import InputBase from '@material-ui/core/InputBase';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Modal from '@material-ui/core/Modal';
import Slide from '@material-ui/core/Slide';
import axios from 'axios';
// import ConnectedMap from './Map/Maps';
import ConnectedMap from './Map'
import ToggleButton from '@material-ui/lab/ToggleButton';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';
import CustomizedSnackbars from '../../CustomizedSnackbars'
import LinearProgress from '@material-ui/core/LinearProgress';
import MapsPanel from '../../MapsPanel'
import HomeIcon from '@material-ui/icons/Home';

const TOKEN = 'pk.eyJ1IjoiZnlwZW5nIiwiYSI6ImNqcmFlazM4YjAxejkzeW1wbWg2Zmp2aWsifQ.obOnEjbqcpEWu9HIh6zPlw'; // Set your mapbox token here
const graphqlUrlHTTPS = 'http://52.77.184.100:3000/graphql';
const restUrlHTTPS = `http://52.77.184.100:3000/api`;

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
  //  padding: `${theme.spacing.unit * 2}px ${theme.spacing.unit * 3}px ${theme.spacing.unit * 3}px`,
    padding: '16px 0px 0px 0px',
  },
  label: {
    textTransform: 'capitalize',
  },
  cameraIcon: {
    opacity: '0.5',
    paddingLeft: '10px'
  },
  cardContent: {
    paddingBottom: '16px'
  },
  paper: {
    width: 'auto',
    overflow: 'auto',
    maxHeight: '500px',
    position: 'absolute',
    width: theme.spacing.unit * 50,
    backgroundColor: theme.palette.background.paper,
    boxShadow: theme.shadows[5],
    padding: theme.spacing.unit * 4,
    outline: 'none',
  },
  infoDialog: {
    [theme.breakpoints.between('sm', 'xl')]: {
      width: '700px',
    },
    [theme.breakpoints.down('sm')]: {
      width: '80vw',
    },
  },
  input: {
    flex: 1,
  },
  button: {
    margin: '2em'
  }
});

const mapStateToProps = state => {
  console.log(state)
  return {
    maps: state.maps,
    map: state.currentMap,
    // devices: state.devices,
    patients: state.patients,
    // assets: state.assets,
    // staff: state.staff,
    deviceLogs: state.deviceLogs,
    // ecg: state.ecg,
    // heartrate: state.heartrate,
    // isAuthenticating: state.isAuthenticating,
    authenticated: state.authenticated,
    // staticDevices: state.staticDevices,
    // featureCollection: state.featureCollection,
    // currentMap: state.currentMap
  };
};

const mapDispatchToProps = dispatch => {
  return {
    // addUsername: username => dispatch(addUsername(username)),
    // editPatient: patient => dispatch(editPatient(patient)),
    // addPatient: patient => dispatch(addPatient(patient)),
    // removePatient: patient => dispatch(removePatient(patient)),
    // fetchMaps: maps => dispatch(fetchMaps(maps)),
    // loadMap: map => dispatch(loadMap(map)),
    // fetchDevices: devices => dispatch(fetchDevices(devices)),
    // // fetchStaticDevices: staticDevices => dispatch(fetchDevices(staticDevices)),
    // fetchDeviceLocations: devices => dispatch(fetchDeviceLocations(devices)),
    // loadInfo: object => dispatch(loadInfo(object)),
    // fetchEcgVitals: vitals => dispatch(fetchEcgVitals(vitals)),
    // fetchHeartrateVitals: vitals => dispatch(fetchHeartrateVitals(vitals)),
    // highlightPatient: patients => dispatch(highlightPatient(patients)),
    // highlightStaff: staff => dispatch(highlightStaff(staff)),
    // highlightAsset: asset => dispatch(highlightAsset(asset)),
    // fetchSimulationCoordinates: coord => dispatch(fetchSimulationCoordinates(coord)),
    // signOutUser: credentials => dispatch(signOutUser(credentials)),
  };
};



let id = 0;
function createData(name, calories, object, carbs, protein) {
  id += 1;
  return { id, name, calories, object, carbs, protein };
}

function Transition(props) {
  return <Slide direction="up" {...props} />;
}

const rows = [
  createData('Frozen yoghurt', 159, 6.0, 24, 4.0),
  createData('Ice cream sandwich', 237, 9.0, 37, 4.3),
  createData('Eclair', 262, 16.0, 24, 6.0),
  createData('Cupcake', 305, 3.7, 67, 4.3),
  createData('Gingerbread', 356, 16.0, 49, 3.9),
];


class LocationTracking extends Component {
  constructor(props) {
    super(props);
    this.state = {
      anchorEl: null,
      anchorLocationEl: null,
      auth: true,
      name: "",
      owner: "",
      image: "",
      imagePreview: "",
      imageName: "",
      ward: "",
      value: "0",
      patients: [],
      staff: [],
      assets: [],
      filter: "",
      filteredStaff: "",
      filteredAssets: "",
      openLocation: false,
      openPatients: false,
      openAssets: false,
      openStaff: false,
      transientDevices: [],
      warning: false,
      staticDevices: [],
    };
  }

  componentDidMount() {
    const { actions } = this.props;
    actions.maps.fetch();
    actions.devices.fetch();
    this.timer = setInterval(()=> this.getDeviceLogs(), 1000);
    this.createDataRows();
    //this.props.fetchEcgVitals();
    //this.props.fetchHeartrateVitals();
  }

  componentWillUnmount() {
  clearInterval(this.timer)
  this.timer = null; // here...
}

  componentDidUpdate(prevProps, prevState) {
    if(this.props.map !== prevProps.map | this.state.filter != prevState.filter | this.props.patients != prevProps.patients | this.props.staff != prevProps.staff |this.props.assets != prevProps.assets ) {
      this.createDataRows()
    }

    if(this.props.deviceLogs !== prevProps.deviceLogs) {
      this.tweenTransientDevices()
    }

    if(this.props.isAuthenticating == false && this.props.authenticated == false) {
      this.props.history.push('/');
    }
  }

  tweenTransientDevices = () => {
    let deviceLogs = this.props.deviceLogs
    let transitionDevices = {}
    let newDevices = {}
    // determine new and transition devices
    deviceLogs.forEach(({id, lat, lng, map})=> {
      transitionDevices[id] = {lat: lat, lng: lng}
      if (this.state.transientDevices[id] != null)
        transitionDevices[id] = {lat: lat, lng: lng}
      else
        newDevices[id] = {lat: lat, lng: lng}
    });
    // add new devices
    this.setState({transitionDevices: Object.assign({}, this.state.transientDevices, newDevices)})
  }

  createDataRows = () => {
    let patients = this.props.patients;
    let staff = this.props.staff;
    let assets = this.props.assets;
    let patientRows = []
    let staffRows = []
    let assetRows = []
    if(this.props.map != null) {
      patients = patients.filter((patient) => patient.ward == this.props.map.id)
      if(this.state.filter.type == "patients") {
        patients = patients.filter((patient) => patient.name.includes(this.state.filter.value))
      }
      // staff = staff.filter((staffmember) => staffmember.ward == this.props.map.id)
      // if(this.state.filter.type == "staff") {
      //   staff = staff.filter((staffmember) => staffmember.name.includes(this.state.filter.value))
      // }
      // assets = assets.filter((asset) => asset.ward == this.props.map.id)
      // if(this.state.filter.type == "assets") {
      //   assets = assets.filter((asset) => asset.name.includes(this.state.filter.value))
      // }
    }

    this.setState({patients: patients})
    // this.setState({assets: assets})
    // this.setState({staff: staff})

  }

  createData = (name, ward, fat, carbs, protein) => {
    id += 1;
    return { id, name, ward, fat, carbs, protein };
  }

  handleLogOut = () => {
    this.handleClose()
    this.props.signOutUser()
  }

  request = ({query, variables}) => {
    let promise = fetch(`${graphqlUrlHTTPS}`, {
      method:   'post',
      mode: 'cors',
      credentials: 'same-origin',
      headers:  {'Content-Type': 'application/json'},
      body:     JSON.stringify({query, variables})
    }).then(res => res.json())
    return promise;
  }

  getDeviceLogs = (dispatch) => {
    const { actions } = this.props;
    let promise = fetch(`${restUrlHTTPS}/Devices/logs`, {
      method:   'GET',
      mode: 'cors',
      credentials: 'same-origin',
      headers:  {'Content-Type': 'application/json'},
    }).then (res => res.json())
    .then(data => {
        // this.props.fetchDeviceLocations(data)
        actions.devices.fetchDeviceLogs()
      }
    )
    return promise;
  }

  load = (id) => {
    const { actions } = this.props;
    actions.maps.load(id);
    this.createDataRows();
  }

  search = (e,type) => {
    let filter = {type: type, value: e.target.value}
    this.setState({filter: filter})
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

    this.setState({ anchorEl: null });
  };

  handleSubmit = (e) => {
    e.preventDefault();
    this.props.history.push('/home');

  }

  infoButton = (patient) => {
    let newPatient = {...patient, type: 'Patient'}
    this.props.loadInfo(newPatient);
    this.props.history.push('/patientInfo');
  }

  staffInfoButton = (staff) => {
    let newStaff = {...staff, type: 'Staff'}
    this.props.loadInfo(newStaff);
    this.props.history.push('/staffInfo');
  }

  assetInfoButton = (asset) => {
    let newAsset = {...asset, type: 'Asset'}
    this.props.loadInfo(newAsset);
    this.props.history.push('/assetInfo');
  }

  handleLoading = () => {
    this.setState(state => ({
      loading: !state.loading,
    }))
  }

  handleChange = prop => event => {
    this.setState({ [prop]: event.target.value });
  };

  handleMenuChange = (event, value) => {
    this.setState({ value });
    this.setState({ anchorEl: null });
    this.setState({ drawer: false });
  };

  imageUpload = (e) => {

    if(e.target.files[0]) {
      const image = e.target.files[0];
      this.setState({image})
      this.setState({imagePreview : URL.createObjectURL(e.target.files[0])})
      this.setState({imageName : image.name})
    }

  }

  removeImage = () => {
    this.setState({image : ""});
    this.setState({imagePreview : ""});
    this.setState({imageName: ""});
  }

  cancel = () => {
    this.props.history.push('/home');
  }
  handleToggle = () => {
      this.setState({filter: ""})
      this.setState({ openLocation: true })
  };

  handlePatientsToggle = () => {
    this.setState({filter: ""})
    this.setState({ openPatients: true })
    this.setState({ value: 2 })
  }

  handleAssetsToggle = () => {
    this.setState({filter: ""})
    this.setState({ openAssets: true })
    this.setState({ value: 4 })
  }

  handleStaffToggle = () => {
    this.setState({filter: ""})
    this.setState({ openStaff: true })
    this.setState({ value: 6 })
  }

  handleMenuClose = event => {
    this.setState({ openLocation: false });
    this.setState({ openPatients: false })
    this.setState({ openAssets: false })
    this.setState({ openStaff: false})
    this.setState({value: "0"})

  };

  highlight = (type, object) => {

    let original = object
    let toHighlight = !object.highlight;
    // object.highlight = toHighlight;
    if(type == 'patient') {

      let index = this.props.patients.indexOf(original)

      let action = {
        highlight: toHighlight,
        index: index

      }
      this.props.highlightPatient(action)
    }
    else if(type == 'asset') {
      let index = this.props.assets.indexOf(original)
      let action = {
        highlight: toHighlight,
        index: index

      }
      this.props.highlightAsset(action)
    }
    else {
      let index = this.props.staff.indexOf(original)
      let action = {
        highlight: toHighlight,
        index: index

      }
      this.props.highlightStaff(action)
    }

  }

  edit = (type, object) => {
    this.props.editPatient(object);
    if(type == 'patient')
      this.props.history.push('/editPatient')
    else if(type == 'asset')
      this.props.history.push('/addAsset')
    else
      this.props.history.push('/addStaff')
  }

  goBack = (e) => {
    e.preventDefault();
    this.props.history.push('/home');
  }

  offWarning = () => {
    this.setState({warning: false})
  }

  onClickLocation = (id) => {
    this.load(id)
    this.handleMenuClose()
  }

  createLocationItems = () => {
    let maps = this.props.maps;
    let locationItems = [];
    let locations = maps.map((item) => {
      if (item.id == 'Clinic A_Level 1' || item.id == 'Clinic B_Level 2' || item.id == 'Endoscopy' || item.id == 'AH main lobby' || item.id == 'Walkway_to_B' || item.id == 'E4-08 Floorplan') {
        if (this.props.map != undefined) {
          if(this.props.map.id == item.id) {
            locationItems.push(
              <MenuItem key={item.id} onClick={()=> this.onClickLocation(item.id)}>{item.id} <i className="fas fa-check" style={{marginLeft: 'auto'}}></i></MenuItem>
            )
          } else {
              locationItems.push(
                <MenuItem key={item.id} onClick={()=> this.onClickLocation(item.id)}>{item.id}</MenuItem>
              )
          }
        } else {
            locationItems.push(
              <MenuItem key={item.id} onClick={()=> this.onClickLocation(item.id)}>{item.id}</MenuItem>
            )
        }
      }
    })
    return locationItems;
  }

  render() {
    const { openLocation, openPatients, openAssets, openStaff } = this.state;
    const { classes, staticDevices, currentMap, featureCollection, maps } = this.props;
    const { anchorEl, auth } = this.state;
    const open = Boolean(anchorEl)
    const races = ['Chinese', 'Malay', 'Indian', 'Others'];
    let imagePreview = this.state.imagePreview;
    let imageName = this.state.imageName;
    const { value } = this.state;
    // console.log (this.props)
    // console.log (this.props.currentMap)
    // console.log (this.props.patients)
    // console.log (this.state.patients)
    // console.log (this.state.openLocation)
    let noPatients = "";
    let noStaff = "";
    let noAssets = "";
    // console.log (this.props.map)
    // let staticDevices = this.props.devices.filter(device => device.type == 'static');
    // staticDevices = staticDevices.filter(device => device.location != null)
    // staticDevices = staticDevices.filter(device => device.location.map.id == map.id)
    // this.setState({staticDevices})

    if(this.state.patients.length == 0){
      noPatients = <Typography variant="subtitle1" style={{padding:'1em', textAlign: 'center' }}> There are currently no patients</Typography>;
    }

    if(this.state.staff.length == 0){
      noStaff = <Typography variant="subtitle1" style={{padding:'1em', textAlign: 'center' }}> There are currently no staff</Typography>;
    }

    if(this.state.assets.length == 0){
      noAssets = <Typography variant="subtitle1" style={{padding:'1em', textAlign: 'center' }}> There are currently no assets</Typography>;
    }
    if(!this.props.authenticated) {
      return <LinearProgress />
    } else {
      return (
        <div className={classes.root}>
          <AppBar position="static" style={{boxShadow: "none", backgroundColor: "white"}}>
            <Toolbar>
              <IconButton className={classes.menuButton} color="inherit" aria-label="Menu" onClick={this.toggleDrawer}>
                <MenuIcon />
              </IconButton>
              <Typography variant="title" className={classes.grow} style={{color: "black"}}>
                Location Tracking
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
          <CustomizedSnackbars warning={this.state.warning} onOffWarning={this.offWarning}  />
          <ClickAwayListener onClickAway={this.toggleCloseDrawer}>
            <TemporaryDrawer toggle={this.state.drawer} />
          </ClickAwayListener>
          <Button variant="contained" color="primary" className={classes.button} startIcon={<HomeIcon/>} onClick={this.goBack}>
              Home
          </Button>
          <ConnectedMap featureCollection={featureCollection}/>
          <BottomNavigation
            value={value}
            onChange={this.handleMenuChange}
            showLabels
            className={classes.root}
          >
            <BottomNavigationAction label="Location" icon={<MyLocationIcon />}
              onClick={this.handleToggle}/>
              <Dialog
                aria-labelledby="simple-modal-title"
                aria-describedby="simple-modal-description"
                open={this.state.openLocation}
                TransitionComponent={Transition}
                onClose={this.handleMenuClose}
                style={{alignItems:'center',justifyContent:'center'}}
                fullWidth={true}
              >
                <DialogTitle>
                  Wards
                </DialogTitle>
                <DialogContent>
                  <MenuList>
                    {this.createLocationItems()}
                  </MenuList>
                </DialogContent>
              </Dialog>

              <BottomNavigationAction label="Patients" icon={<PersonPinIcon />}
                onClick={this.handlePatientsToggle}/>
                <Dialog
                  aria-labelledby="simple-modal-title"
                  aria-describedby="simple-modal-description"
                  open={this.state.openPatients}
                  onClose={this.handleMenuClose}
                  TransitionComponent={Transition}
                  style={{alignItems:'center',justifyContent:'center'}}
                  maxWidth={false}
                >
                  <div className={classes.infoDialog}>
                    <DialogTitle>
                      <Typography variant="h4" style={{marginLeft: 8+'px'}}>Patients</Typography>
                      <div style={{marginLeft: 8+ 'px', marginTop: 0.5 + 'em'}}>
                        <InputBase className={classes.input} fullWidth={true} onChange={(e) => this.search( e, 'patients')} placeholder="Search" />
                      </div>
                      <hr/>
                      {this.props.map != undefined ? <Typography variant="h6" style={{marginLeft: 8+'px'}}>Assigned In: {this.props.map.id}</Typography> : void 0}
                      <hr/>
                    </DialogTitle>
                    <DialogContent>
                      <Table className={classes.table}>
                        <TableHead>
                          <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell align="center">Vitals</TableCell>
                            <TableCell align="center">Currently At</TableCell>
                            <TableCell align="center">Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {this.state.patients.map(row => {
                            let highlightButton = ""
                            let currentlyAt = "-"
                            if(row.highlight) {
                              highlightButton = <IconButton style={{background: 'black', color: 'white', opacity: '0.4'}} aria-label="Highlight" className={classes.margin} onClick={() => this.highlight('patient', row)}>
                                <i className="fas fa-highlighter" style={{fontSize: 0.7+'em'}}></i>
                              </IconButton>
                            } else {
                              highlightButton = <IconButton aria-label="Highlight" className={classes.margin} onClick={() => this.highlight('patient', row)}>
                                <i className="fas fa-highlighter" style={{fontSize: 0.7+'em'}}></i>
                              </IconButton>
                            }

                            this.props.deviceLogs.map((device) => {

                              if(row.beacon != null) {
                                if(device.id == row.beacon[0]) {
                                  currentlyAt = device.map.id
                                }
                              }
                            })

                            return (
                              <TableRow key={row.id}>
                                <TableCell component="th" scope="row">
                                  {row.name}
                                </TableCell>

                                <TableCell align="right">
                                  <i className="fas fa-heartbeat"></i> {row.fat}
                                  <i className="fas fa-thermometer" style={{marginLeft: 1 + 'em'}}></i> {row.fat}
                                  </TableCell>
                                <TableCell align="center">
                                  {currentlyAt}
                                </TableCell>
                                <TableCell align="right">
                                  {highlightButton}
                                  <IconButton aria-label="Edit" onClick={()=> this.edit( 'patient', row)} className={classes.margin}>
                                    <i className="far fa-edit" style={{fontSize: 0.7+'em'}}></i>
                                  </IconButton>
                                  <IconButton aria-label="Info" className={classes.margin} onClick={() => this.infoButton(row)}>
                                    <i className="fas fa-info-circle" style={{fontSize: 0.7+'em'}}></i>
                                  </IconButton>
                                </TableCell>
                              </TableRow>
                              );
                            })
                            }
                          </TableBody>
                      </Table>
                      { noPatients }
                    </DialogContent>
                  </div>
                </Dialog>
        <BottomNavigationAction label="Assets" icon={<i className="fas fa-briefcase-medical"  style={{fontSize:20 + 'px'}}/>}
          onClick={this.handleAssetsToggle}/>
          <Dialog
              aria-labelledby="simple-modal-title"
              aria-describedby="simple-modal-description"
              open={this.state.openAssets}
              onClose={this.handleMenuClose}
              style={{alignItems:'center',justifyContent:'center', display: 'flex'}}
              maxWidth={false}
              TransitionComponent={Transition}
            >
                <div className={classes.infoDialog}>
                <DialogTitle>
                  <Typography variant="h4" style={{marginLeft: 8+'px'}}>Assets</Typography>
                  <div style={{marginLeft: 8+ 'px', marginTop: 0.5 + 'em'}}>
                    <InputBase className={classes.input} fullWidth={true} onChange={(e) => this.search( e, 'assets')} placeholder="Search" />
                  </div>


                  <hr/>
                  {this.props.map != undefined ? <Typography variant="h6" style={{marginLeft: 8+'px'}}>Assigned In: {this.props.map.id}</Typography> : void 0}
                  <hr/>
                  </DialogTitle>
                  <DialogContent>
                  <Table className={classes.table}>
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell align="center">Currently At</TableCell>
                        <TableCell align="center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {this.state.assets.map(row => {
                        let highlightButton = ""
                        let currentlyAt = "-"
                        if(row.highlight) {
                          highlightButton = <IconButton style={{background: 'black', color: 'white', opacity: '0.4'}} aria-label="Highlight" className={classes.margin} onClick={() => this.highlight('asset', row)}>
                            <i className="fas fa-highlighter" style={{fontSize: 0.7+'em'}}></i>
                          </IconButton>
                        } else {
                          highlightButton = <IconButton aria-label="Highlight" className={classes.margin} onClick={() => this.highlight('asset', row)}>
                            <i className="fas fa-highlighter" style={{fontSize: 0.7+'em'}}></i>
                          </IconButton>
                        }

                        this.props.deviceLogs.map((device) => {
                          if(row.beacon != null) {
                          if(device.id == row.beacon[0]) {
                            currentlyAt = device.map.id
                          }
                        }
                        })


                        return (
                          <TableRow key={row.id}>
                            <TableCell component="th" scope="row">
                              {row.name}
                            </TableCell>
                            <TableCell align="center">
                              {currentlyAt}
                            </TableCell>
                            <TableCell align="right">
                              {highlightButton}
                              <IconButton aria-label="Edit" onClick={()=> this.edit( 'asset', row)} className={classes.margin}>
                                <i className="far fa-edit" style={{fontSize: 0.7+'em'}}></i>
                              </IconButton>
                              <IconButton aria-label="Info" className={classes.margin} onClick={() => this.assetInfoButton(row)}>
                                <i className="fas fa-info-circle" style={{fontSize: 0.7+'em'}}></i>
                              </IconButton>

                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                  { noAssets }
                  </DialogContent>
                </div>

            </Dialog>
        <BottomNavigationAction label="Staff" icon={<i className="fas fa-user-md fa-sm"  style={{fontSize:20 + 'px'}}/>}
          onClick={this.handleStaffToggle}
        />
        <Dialog
            aria-labelledby="simple-modal-title"
            aria-describedby="simple-modal-description"
            open={this.state.openStaff}
            onClose={this.handleMenuClose}
            style={{alignItems:'center',justifyContent:'center', display: 'flex'}}
            maxWidth={false}
            TransitionComponent={Transition}
          >
              <div className={classes.infoDialog}>
              <DialogTitle>
                <Typography variant="h4" style={{marginLeft: 8+'px'}}>Staff</Typography>

                <div style={{marginLeft: 8+ 'px', marginTop: 0.5 + 'em'}}>
                  <InputBase className={classes.input} fullWidth={true} onChange={(e) => this.search( e, 'staff')}placeholder="Search" />
                </div>


                <hr/>
                {this.props.map != undefined ? <Typography variant="h6" style={{marginLeft: 8+'px'}}>Assigned In: {this.props.map.id}</Typography> : void 0}
                <hr/>
                </DialogTitle>
                <DialogContent>
                <Table className={classes.table}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell align="center">Currently At</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {this.state.staff.map(row => {
                      let highlightButton = ""
                      let currentlyAt = "-"
                      if(row.highlight) {
                        highlightButton = <IconButton style={{background: 'black', color: 'white', opacity: '0.4'}} aria-label="Highlight" className={classes.margin} onClick={() => this.highlight('staff', row)}>
                          <i className="fas fa-highlighter" style={{fontSize: 0.7+'em'}}></i>
                        </IconButton>
                      } else {
                        highlightButton = <IconButton aria-label="Highlight" className={classes.margin} onClick={() => this.highlight('staff', row)}>
                          <i className="fas fa-highlighter" style={{fontSize: 0.7+'em'}}></i>
                        </IconButton>
                      }

                      this.props.deviceLogs.map((device) => {
                        if(row.beacon != null) {
                        if(device.id == row.beacon[0]) {
                          currentlyAt = device.map.id
                        }
                      }
                      })
                      return (
                        <TableRow key={row.id}>
                          <TableCell component="th" scope="row">
                            {row.name}
                          </TableCell>
                          <TableCell align="center">
                            {currentlyAt}
                          </TableCell>
                          <TableCell align="right">
                            {highlightButton}
                            <IconButton aria-label="Edit" onClick={()=> this.edit( 'staff', row)}className={classes.margin}>
                              <i className="far fa-edit" style={{fontSize: 0.7+'em'}}></i>
                            </IconButton>
                            <IconButton aria-label="Info" className={classes.margin} onClick={() => this.staffInfoButton(row)}>
                              <i className="fas fa-info-circle" style={{fontSize: 0.7+'em'}}></i>
                            </IconButton>

                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                { noStaff }
                </DialogContent>
              </div>
        </Dialog>
      </BottomNavigation>
      </div>

      )
    }
  }
}

const ConnectedLocationTracking = connect(mapStateToProps, Actions)(LocationTracking);

export default withStyles(styles)(ConnectedLocationTracking);
