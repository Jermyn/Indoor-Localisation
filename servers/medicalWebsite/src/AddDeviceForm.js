import React, { Component } from 'react';
import AppBar from '@material-ui/core/AppBar';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import Toolbar from '@material-ui/core/Toolbar';
import { withStyles } from '@material-ui/core/styles';
import { connect } from "react-redux";
import { confirmType, addPatient, fetchMaps, editPatient, removePatient, fetchNewBeacon, fetchingProcess, fetchingDone, updateBeaconCount, assignBeacon } from "./actions/index";
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
import Scanner from './Scanner';
import Result from './Result';
import Select from 'react-select';
import axios from 'axios';
import NoSsr from '@material-ui/core/NoSsr';
import Paper from '@material-ui/core/Paper';
import Chip from '@material-ui/core/Chip';
import CancelIcon from '@material-ui/icons/Cancel';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import Stepper from '@material-ui/core/Stepper';
import Step from '@material-ui/core/Step';
import StepLabel from '@material-ui/core/StepLabel';
import StepContent from '@material-ui/core/StepContent';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import LocationOnIcon from '@material-ui/icons/LocationOn';


const graphqlUrlHTTPS = 'http://137.132.165.139:3000/graphql';


const styles = theme => ({
  container: {
    display: 'flex',
    flexWrap: 'wrap',
  },
  root: {
    flexGrow: 1,
  },
  idPaper: {
    float: 'left',
    padding: '15px',
    marginTop: '-20px',
    marginRight: '15px',
    borderRadius: '3px',
    zIndex: 2,
     backgroundColor: '#339af0',

    //background: 'linear-gradient(60deg, #26c6da, #00acc1)',
    boxShadow: '0 4px 20px 0 rgba(0, 0, 0,.14), 0 7px 10px -5px rgba(51, 154, 240,.4)',
  },
  grow: {
    flexGrow: 1,
  },
  card: {
    minWidth: 200,

  },
  title: {
    fontSize: 14,
  },
  pos: {
    marginBottom: 12,
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
  card_actions: {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginTop: '16px',
}
});

const mapStateToProps = state => {
  return {
    beacon: state.beacon,
    maps: state.maps,
    edit: state.edit,
    fetching: state.fetching,
    beaconCounter: state.beaconCounter.count,
    deviceLogs: state.deviceLogs,
   };
};

const mapDispatchToProps = dispatch => {
  return {
    confirmType: type => dispatch(confirmType(type)),
    addPatient: patient => dispatch(addPatient(patient)),
    editPatient: patient => dispatch(editPatient(patient)),
    removePatient: patient => dispatch(removePatient(patient)),
    fetchMaps: maps => dispatch(fetchMaps(maps)),
    fetchNewBeacon: count => dispatch(fetchNewBeacon(count)),
    fetchingProcess: fetch => dispatch(fetchingProcess(fetch)),
    assignBeacon: beacon => dispatch(assignBeacon(beacon)),
    fetchingDone: fetch => dispatch(fetchingDone(fetch)),
    updateBeaconCount: count => dispatch(updateBeaconCount(count))
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

function Control(props) {
  return (
    <TextField
      fullWidth
      variant="outlined"
      InputProps={{
        inputComponent,
        inputProps: {
          className: props.selectProps.classes.input,
          inputRef: props.innerRef,
          children: props.children,
          ...props.innerProps,
        },
      }}
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

class AddDeviceForm extends Component {
  constructor(props) {
    super(props);

    this.state = {
      anchorEl: null,
      auth: true,
      id: "",
      beaconId: "",
      measuredPower: "-63",
      gattId: "",
      gattProfile: "",
      open: false,
      beacon: this.props.beacon,
      scanning: false,
      results: [],
      options: [],
      edit: false,
      step: 1,
      fetchAttempts: -1,
      errorMessage: "",
    };
  }

  componentDidMount() {
    this.props.fetchNewBeacon()
    if(this.props.open != "" && this.props.open != null) {
      this.setState({open: this.props.open})
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if(this.props.open !== "" && this.props.open != null && this.props.open !== this.state.open ) {
      this.setState({open: this.props.open})
    }

    if(this.props.beaconCounter !== "" && this.props.beaconCounter != null && this.props.beaconCounter !== prevProps.beaconCounter ) {
      let beaconId = `3:${this.props.beaconCounter}`
      let id = `b${this.props.beaconCounter}`
      this.setState({beaconId})
      this.setState({id})
    }

    if(this.props.fetching == true && this.state.fetchAttempts == 0) {
     this.noConnection()
     clearInterval(this.timer)
     this.timer = null; // here...
    }
  }

  noConnection = () => {
    this.props.fetchingDone()
    let errorMessage = <div style={{marginTop: '1em', textAlign: 'center'}}> Unable to connect to beacon. <br/>
    Please check Gimbal if it is successfully activated </div>
    this.setState({errorMessage})
    this.deleteDevice()
  }

  verifyConnection = () => {
    let found = false;
    let checkId = `b${this.props.beaconCounter}`
    let deviceLogs = this.props.deviceLogs
    deviceLogs.map( (device) => {
      if(device.id == checkId) {
        found = true
        this.props.assignBeacon([checkId])
      }
    })

    if(found == true) {
      this.setState({fetchAttempts: 0})
      this.props.fetchingDone()
      clearInterval(this.timer)
      this.timer = null; // here...
      this.props.updateBeaconCount(this.props.beaconCounter)

      this.handleClose()
    } else {
      let fetchAttempts = this.state.fetchAttempts - 1
      this.setState({fetchAttempts})
    }
  }

  handleClickOpen = () => {
     this.setState({ open: true });
  };

  handleClose = () => {
     this.props.handleClose()
  };

  createOptions = (maps) => {
    let options = maps.map((map) => ({
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

  handleMenu = event => {
    this.setState({ drawer: false });
    this.setState({ anchorEl: event.currentTarget });
  };


  packageDevice = () => {
    let device = {}

    if(this.state.id != "") {
      device.device = {id: this.state.id, type: 'mobile'}
    }

    if(this.state.beaconId != "") {
      device.beacon = {id: this.state.beaconId}
      if(this.state.measuredPower != "") {
        device.beacon.measuredPower = this.state.measuredPower
      }
    }

    if(this.state.gattId != "") {
      device.gatt = {id: this.state.gattId};
      if (this.state.gattProfile != "") {
        device.gatt.profile = JSON.parse(this.state.gattProfile );
      }
    }
    return device
  }

  deleteDevice = () => {
    let id = this.state.id
    let variables = {id: id}
    let query = `
      mutation ($id: String!) {
        deleteDevice(id: $id) { id }
      }
    `;
    this.requestPost({query, variables})

  }
  createDevice = (device) => {
    let variables  = {input: device}
    let query = `
        mutation ($input: CreateDeviceInput!) {
          createDevice(input: $input) { id }
        }
      `;
    this.requestPost({query, variables})
  }

  requestPost = ({query, variables}) => {
    let graphqlUrl= "http://137.132.165.139:3000/graphql"
    axios({
        method:   'post',
        url:      `${graphqlUrl}`,
        headers:  {'Content-Type': 'application/json'},
        data:     JSON.stringify({query, variables})
      })
  }



  handleSubmit = (e) => {
    e.preventDefault();
    this.props.fetchingProcess()
    const { type } = this.state;
    this.setState({fetchAttempts: 30})
    let device = this.packageDevice()
    this.createDevice(device);
    this.timer = setInterval(()=> this.verifyConnection(), 1000);
  }

  handleLoading = () => {
    this.setState(state => ({
      loading: !state.loading,
    }))
  }

  handleChange = prop => event => {
    if(prop == "ward")
      this.setState({ [prop]: event });
    else {
      this.setState({ [prop]: event.target.value });
    }
  };

  checkGimbal = () => {
    let gimbalUrl= "https://manager.gimbal.com/api/beacons"
    window.open("https://manager.gimbal.com/login/users/sign_in");
  }


  cancel = () => {
    this.props.history.push('/home');
  }

  _scan = (e) => {
        e.preventDefault();
        this.setState({scanning: !this.state.scanning});
    }

    _onDetected = (result) => {
        let results = this.state.results;
        if(results.indexOf(result) < 0)
          this.setState({results: this.state.results.concat([result])});
    }

  renderLoading = () => {
    let loading = <div style={{textAlign: 'center', marginTop: '1em'}}> <CircularProgress />  <Typography variant="subtitle2"> Verifying ... </Typography></div>

    return loading;
  }
  render() {

    const { classes, theme } = this.props;
    const { anchorEl, auth } = this.state;
    const open = Boolean(anchorEl)

    const selectStyles = {
      input: base => ({
        ...base,
        color: theme.palette.text.primary,
        '& input': {
          font: 'inherit',
        },
      }),
    };

    return (
      <div>
        <Dialog
          open={this.state.open}
          onClose={this.handleClose}
          aria-labelledby="form-dialog-title"
        >
          <DialogTitle id="form-dialog-title">Add Beacon</DialogTitle>
          <DialogContent>
            <Grid
              container
              spacing={0}
              direction="column"
              alignItems="center"
              justify="center"
            >
              <Grid item xs={12}>
                <Card className={classes.card} style={{display: 'inline-block'}}>
                  <CardContent style={{textAlign: 'center'}}>
                    <Paper className={classes.idPaper} elevation={10}>
                      <span>
                        <LocationOnIcon style={{fontSize: '30px', color: 'white'}} />
                      </span>
                    </Paper>
                    <Typography color="textSecondary">
                      Beacon ID
                    </Typography>
                    <Typography variant="h5" component="h2" style={{fontSize: '1.825em'}} >
                      3:{this.props.beaconCounter != "" ? this.props.beaconCounter : null}
                    </Typography>
                    {this.props.fetching ? this.renderLoading() : null}
                  </CardContent>
                {this.props.fetching ? null :
                  <CardActions className={classes.card_actions}>
                    <Grid
                      justify="center"
                      container
                      spacing={24}
                    >
                      <Button size="small" onClick={this.checkGimbal}>Gimbal Site</Button>
                    </Grid>
                  </CardActions> }
                </Card>
              </Grid>
            </Grid>

            <Typography variant="subtitle1" style={{color: 'red'}}> {this.state.errorMessage }  </Typography>

            <Typography variant="body1" component='p' paragraph style={{marginTop: '16px'}}>
              1. Copy the Beacon ID provided and open the Gimbal Site by clicking on the 'Gimbal Site' button.
            </Typography>

            <Typography variant="body1" component='p' paragraph>
              2. Login to the Gimbal Site and navigate to <b> Beacons > Beacons Management </b>
            </Typography>

            <Typography variant="body1" component='p' paragraph>
              3. Click on <b>+ Activate Beacon</b> on the top of the table of beacons
            </Typography>

            <Typography variant="body1" component='p' paragraph>
              4. Fill in the Beacon ID under the Beacon Name and the Factory ID can be found in the Beacon itself.
              Submit the form and wait and once successfully activated, return to this application.
            </Typography>

            <br/>
            {/*
              <FormControl margin="normal" required fullWidth>
                <TextField
                  label="id"
                  placeholder="id"
                  variant="outlined"
                  value={this.state.id}
                  fullWidth
                  className={classes.textField}
                  onChange = {(e) => this.setState({id:e.target.value})}
                />
              </FormControl>

            <FormControl margin="normal" required fullWidth>
              <TextField
                label="Beacon ID"
                placeholder="Beacon ID"
                variant="outlined"
                value={this.state.beaconId}
                fullWidth
                className={classes.textField}
                onChange = {(e) => this.setState({beaconId:e.target.value})}
              />
            </FormControl>

            <FormControl margin="normal" required fullWidth>
              <TextField
                label="Measured Power"
                placeholder="Measured Power"
                variant="outlined"
                value={this.state.measuredPower}
                fullWidth
                className={classes.textField}
                onChange = {(e) => this.setState({measuredPower:e.target.value})}
              />
            </FormControl>

            <FormControl margin="normal" required fullWidth>
              <TextField
                label="Gatt ID"
                placeholder="Gatt ID"
                variant="outlined"
                value={this.state.gattId}
                fullWidth
                className={classes.textField}
                onChange = {(e) => this.setState({gattId:e.target.value})}
              />
            </FormControl>

            <FormControl margin="normal" required fullWidth>
              <TextField
                label="Gatt Profile"
                placeholder="Gatt Profile"
                variant="outlined"
                value={this.state.gattProfile}
                fullWidth
                className={classes.textField}
                onChange = {(e) => this.setState({gattProfile:e.target.value})}
              />
            </FormControl>
          */}
          </DialogContent>
          <DialogActions>
           <Button onClick={this.handleClose} color="primary">
            Cancel
           </Button>
           <Button onClick={this.handleSubmit} color="primary">
            Next
           </Button>
          </DialogActions>
        </Dialog>
      </div>
    )
  }
}

const ConnectedAddDeviceForm = connect(mapStateToProps, mapDispatchToProps)(AddDeviceForm);

export default withStyles(styles, {withTheme: true})(ConnectedAddDeviceForm);
