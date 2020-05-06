import React, { Component } from 'react';
import AppBar from '@material-ui/core/AppBar';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import Toolbar from '@material-ui/core/Toolbar';
import { withStyles } from '@material-ui/core/styles';
import { connect } from "react-redux";
import { confirmType, addPatient, fetchMaps, editPatient, removePatient } from "./actions/index";
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
});

const mapStateToProps = state => {
  return {
    beacon: state.beacon,
    maps: state.maps,
    edit: state.edit,
   };
};

const mapDispatchToProps = dispatch => {
  return {
    confirmType: type => dispatch(confirmType(type)),
    addPatient: patient => dispatch(addPatient(patient)),
    editPatient: patient => dispatch(editPatient(patient)),
    removePatient: patient => dispatch(removePatient(patient)),
    fetchMaps: maps => dispatch(fetchMaps(maps))
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

class AddDevice extends Component {
  constructor(props) {
    super(props);

    this.state = {
      anchorEl: null,
      auth: true,
      id: "",
      beaconId: "",
      measuredPower: "",
      gattId: "",
      gattProfile: "",
      beacon: this.props.beacon,
      scanning: false,
      results: [],
      options: [],
      edit: false,
    };
  }

  componentDidMount() {
    this.fetch();
    if(this.props.edit != "" && this.props.edit != null) {
      let edit = this.props.edit;
      this.setState({
        name: edit.name,
        age: edit.age,
        race: edit.race,
        gender: edit.gender,
        ward: {value: edit.ward, label: edit.ward},
        edit: true,
      })
    }
  }

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

  handleClose = () => {
    this.setState({ anchorEl: null });
  };

  packageDevice = () => {
    let device = {}

    if(this.state.id != "") {
      device.device = {id: this.state.id, type: 'mobile'}
    }

    if(this.state.beaconId != "") {
      device.device = {id: this.state.beaconId}
    }

    if(this.state.gattId != "") {
      device.gatt = {id: this.state.gattId};
      if (this.state.gattProfile != "") {
        device.gatt.profile = JSON.parse(this.state.gattProfile );
      }
    }
    return device
  }

  // create: (device) -> (dispatch) ->
  //   variables = {input: device}
  //   query = "
  //     mutation ($input: CreateDeviceInput!) {
  //       createDevice(input: $input) { id }
  //     }
  //   "
  //   request({query, variables})
  //   .then ({data}) ->
  //     dispatch actions.fetch()
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
    const { type } = this.state;

    let device = this.packageDevice()

    this.createDevice(device);

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
      <div className={classes.root}>
      <AppBar position="static" style={{boxShadow: "none", backgroundColor: "white"}}>
        <Toolbar>
          <IconButton className={classes.menuButton} color="inherit" aria-label="Menu" onClick={this.toggleDrawer}>
            <MenuIcon />
          </IconButton>
          <Typography variant="title" className={classes.grow} style={{color: "black"}}>
            {this.state.edit ? 'Edit': 'Add'} Device
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
                  <MenuItem onClick={this.handleClose}>Logout</MenuItem>
                </Menu>
              </div>
            )}
        </Toolbar>
      </AppBar>
        <TemporaryDrawer toggle={this.state.drawer} />
        <form className={classes.align}>
        <Grid container
          direction="column"
          spacing={0}
          alignItems="center"
          style={{ minHeight: '75vh'}}>

          <Grid item xs={12} lg={5}>
          <div className={classes.layout}>
            <Typography variant="h4" gutterBottom>Device</Typography>
            <Typography variant="h6" gutterBottom>Barcode Scan</Typography>
            <Button variant="outlined" onClick={this._scan}>{this.state.scanning ? 'Stop' : 'Start'}</Button>
              <ul className="results">
                  {this.state.results.map((result) => (<Result key={result.codeResult.code} result={result} />))}
              </ul>
              {this.state.scanning ? <Scanner onDetected={this._onDetected}/> : null}

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
            </div>
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




          <br/>
          <div style={{ textAlign: 'center', paddingTop: '1rem'}}>
          <Button variant="contained" color="primary" onClick={(event) => this.handleSubmit(event)}>
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

const ConnectedAddDevice = connect(mapStateToProps, mapDispatchToProps)(AddDevice);

export default withStyles(styles, {withTheme: true})(ConnectedAddDevice);
