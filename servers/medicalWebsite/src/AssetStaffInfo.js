import React, { Component } from 'react';
import AppBar from '@material-ui/core/AppBar';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import Toolbar from '@material-ui/core/Toolbar';
import { withStyles } from '@material-ui/core/styles';
import { connect } from "react-redux";
import { addUsername, signOutUser, fetchHeartrateVitals, fetchEcgVitals, fetchSpecificHeartrateVitals, fetchSpecificEcgVitals } from "./actions/index";
import Card from '@material-ui/core/Card';
import CardMedia from '@material-ui/core/CardMedia';
import CardContent from '@material-ui/core/CardContent';
import CardActions from '@material-ui/core/CardActions';
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
import CameraIcon from '@material-ui/icons/PhotoCamera';
import DeleteIcon from '@material-ui/icons/Delete';
import Chip from '@material-ui/core/Chip';
import Paper from '@material-ui/core/Paper';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import HealthChart from "./HealthChart";
import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import socketIOClient from "socket.io-client";
import ClickAwayListener from '@material-ui/core/ClickAwayListener';
import ToggleButton from '@material-ui/lab/ToggleButton';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';
import axios from 'axios'
import PlaybackChart from './PlaybackChart'
import ConnectedPlaybackMode from './PlaybackMode'
import ECGChart from './ECGChart'
import RespirationChart from './RespirationChart'
import InfoMap from "./InfoMap"
import PlaybackMapMode from "./PlaybackMapMode"

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
    padding: '1.5rem',
    flexGrow: '1',
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
  demo: {
    padding: '16px 32px 24px',
    // [theme.breakpoints.up("sm")]: {
    //   width: '560px'
    // }
  },
  demoOne: {
    padding: '16px 32px 5px',
    // [theme.breakpoints.up("sm")]: {
    //   width: '560px'
    // }
  },
  toggleContainer: {
    height: 56,
    padding: `${theme.spacing.unit}px ${theme.spacing.unit * 2}px`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    margin: `${theme.spacing.unit}px 0`,
  },
  button: {
    margin: theme.spacing.unit,
  },

});

const mapStateToProps = state => {
  return {
    beacon: state.beacon,
    ecg: state.ecg,
    info: state.info,
    heartrate: state.heartrate,
    isAuthenticating: state.isAuthenticating,
    authenticated: state.authenticated,
  };
};

const mapDispatchToProps = dispatch => {
  return {
    addUsername: username => dispatch(addUsername(username)),
    fetchEcgVitals: vitals => dispatch(fetchEcgVitals(vitals)),
    fetchHeartrateVitals: vitals => dispatch(fetchHeartrateVitals(vitals)),
    fetchSpecificHeartrateVitals: vitals => dispatch(fetchSpecificHeartrateVitals(vitals)),
    fetchSpecificEcgVitals: vitals => dispatch(fetchSpecificEcgVitals(vitals)),
    signOutUser: credentials => dispatch(signOutUser(credentials))
  };
};

let id = 0;
function createData(name, calories, fat, carbs, protein) {
  id += 1;
  return { id, name, calories, fat, carbs, protein };
}

const rows = [
  createData('Frozen yoghurt', 159, 6.0, 24, 4.0),
  createData('Ice cream sandwich', 237, 9.0, 37, 4.3),
  createData('Eclair', 262, 16.0, 24, 6.0),
  createData('Cupcake', 305, 3.7, 67, 4.3),
  createData('Gingerbread', 356, 16.0, 49, 3.9),
];

class AssetStaffInfo extends Component {
  constructor(props) {
    super(props);

    this.state = {
      loading: false,
      values: {},
      anchorEl: null,
      auth: true,
      name: "Santa Claus",
      owner: "",
      image: "",
      imagePreview: "",
      imageName: "",
      ward: "",
      contactDistance: "",
      tab: 0,
      beacon: this.props.beacon,
      response: [],
      chartMode: ['live'],
      mapMode: ['live'],
      endpoint: "https://330f4015.ngrok.io",
      startTime: '2019-03-11T15:38:48.033972',
      endTime: '2019-03-11T15:38:49.271003',
      playbackRes: [],
      ecg: [],
      heartrate: [],
    };
  }

  componentDidMount() {
    this.setState({ loading: true });

    if(this.props.info != "") {
      this.setState({name: this.props.info.name})
      this.setState({devices: this.props.info.devices})

      let devices = this.props.info.devices
      if(devices != null && devices[0] != "None") {
        devices.map((device) => {
          if(device.id.charAt(0) == 'e') {
            this.props.fetchSpecificEcgVitals(device.uuid);
          }

          if(device.id.charAt(0) == 'h') {
            this.props.fetchSpecificHeartrateVitals(device.uuid);
          }
        })
      }
    } else {
      this.props.history.push('/locationTracking');
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if(this.props.ecg !== prevProps.ecg ) {
      this.setState({ecg: this.props.ecg})
    }

    if(this.props.heartrate !== prevProps.heartrate ) {
      this.setState({heartrate: this.props.heartrate})
    }

    if(this.props.isAuthenticating == false && this.props.authenticated == false) {
      this.props.history.push('/');
    }
  }

  toggleDrawer = () => {
    this.setState({ drawer: true});
  }

  handleFormat = (event, chartMode) => {
    if(chartMode != this.state.chartMode && chartMode != null)
      this.setState({ chartMode });
  }

  handleMapFormat = (event, mapMode) => {
    if(mapMode != this.state.mapMode && mapMode != null)
      this.setState({ mapMode });
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

  handleLogOut = () => {
    this.handleClose()
    this.props.signOutUser()
  }

  backToMap = (e) => {
    e.preventDefault();
    this.props.history.push('/locationTracking');
  }

  handleSubmit = (e) => {
    e.preventDefault();
    this.props.history.push('/home');

  }

  handleLoading = () => {
    this.setState(state => ({
      loading: !state.loading,
    }))
  }

  handleChange = prop => event => {
    this.setState({ [prop]: event.target.value });
  };

  handleTabChange = (event, value) => {
   this.setState({ tab: value });
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

  updateStart = (e) => {
    this.setState({startTime: e.target.value})
  }

  updateEnd = (e) => {
    this.setState({endTime: e.target.value})
  }

  cancel = () => {
    this.props.history.push('/home');
  }

  submitQuery = () => {

    const query = {
      "size": 10000,
      "sort" : [{ "timestamp" : {"order" : "asc"}}],
      "query": {
        "range" : {
            "timestamp" : {
              "gte": this.state.startTime,
              "lte": this.state.endTime,
              }
          }
        }

    };

    axios.get('http://localhost:9200/_search', {
      params: {
        source: JSON.stringify(query),
        source_content_type: 'application/json'
      }
    }).then((res) => {
      this.setState({playbackRes: res.data.hits.hits})
    });
  }

  renderPlaybackForm = () => {
    const { classes } = this.props;
    let form = <div>
    <form className={classes.container} noValidate>
      <TextField
        id="datetime-local"
        label="Start"
        type="datetime-local"
        defaultValue="2017-05-24T10:30"
        className={classes.textField}
        onChange={this.updateStart}
        InputLabelProps={{
          shrink: true,
        }}
      />

      <TextField
        id="datetime-local"
        label="End"
        type="datetime-local"
        defaultValue="2017-05-24T10:30"
        className={classes.textField}
        onChange={this.updateEnd}
        InputLabelProps={{
          shrink: true,
        }}
      />
      <div>
      <Button variant="outlined" color="primary" onClick={this.submitQuery} className={classes.button}>
        Fetch
      </Button>
      </div>
    </form>

    </div>

    return form
  }
  render() {

    const { classes } = this.props;
    const { anchorEl, auth } = this.state;
    const open = Boolean(anchorEl)

    return (
      <div className={classes.root}>
        <AppBar position="static" style={{boxShadow: "none", backgroundColor: "white"}}>
          <Toolbar>
            <IconButton className={classes.menuButton} color="inherit" aria-label="Menu" onClick={this.toggleDrawer}>
              <MenuIcon />
            </IconButton>
            <Typography variant="title" className={classes.grow} style={{color: "black"}}>
              Status Tracking
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
        <Grid container justify="left">
          <Grid container
            className={classes.demoOne}
            spacing={0}
            alignItems="center"
          >
            <Button size="small" onClick={this.backToMap}>
              Back To Map
            </Button>
          </Grid>
        </Grid>
        <Grid container justify="center">
          <Grid container
            className={classes.demo}
            justify="center"
            spacing={0}
            alignItems="center"
            style={{ minHeight: '75vh'}}>
            <Card className={classes.card}>
              <CardContent>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>{this.state.name}</Typography>
                </Grid>

                <Grid item xs={12}>
                  <div className={classes.toggleContainer}>
                    <ToggleButtonGroup value={this.state.mapMode} exclusive onChange={this.handleMapFormat}>
                      <ToggleButton value="live">
                        Live
                      </ToggleButton>
                      <ToggleButton value="playback">
                        Playback
                      </ToggleButton>
                    </ToggleButtonGroup>
                  </div>
                  {this.state.mapMode == 'live' ? <InfoMap /> : <PlaybackMapMode />}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container justify="left">
          <Grid container
            className={classes.demoOne}
            spacing={0}
            alignItems="center"
            >
            <Button size="small" onClick={this.backToMap} style={{marginBottom: '1em'}}>
              Back To Map
            </Button>
          </Grid>
        </Grid>
      </div>
    )
  }
}

const ConnectedAssetStaffInfo = connect(mapStateToProps, mapDispatchToProps)(AssetStaffInfo);

export default withStyles(styles)(ConnectedAssetStaffInfo);
