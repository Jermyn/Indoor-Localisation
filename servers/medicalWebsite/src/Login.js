import React, { Component } from 'react';
import AppBar from '@material-ui/core/AppBar';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import Toolbar from '@material-ui/core/Toolbar';
import { withStyles } from '@material-ui/core/styles';
import { connect } from "react-redux";
import { addUsername, signInUser, verifyAuth } from "./actions/index";
import Card from '@material-ui/core/Card';
import CircularProgress from '@material-ui/core/CircularProgress';
import Paper from '@material-ui/core/Paper';
import FormControl from '@material-ui/core/FormControl';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import LockIcon from '@material-ui/icons/LockOutlined';
import Avatar from '@material-ui/core/Avatar';
import Visibility from '@material-ui/icons/Visibility';
import VisibilityOff from '@material-ui/icons/VisibilityOff';
import InputAdornment from '@material-ui/core/InputAdornment';
import IconButton from '@material-ui/core/IconButton';
import classNames from 'classnames';
import Input from '@material-ui/core/Input';
 import { medicalPortalFirebase } from "./firebase/index"



const styles = theme => ({
  container: {
    display: 'flex',
    flexWrap: 'wrap',
  },
  layout: {
    width: 'auto',
    display: 'block', // Fix IE 11 issue.
    marginLeft: theme.spacing.unit * 3,
    marginRight: theme.spacing.unit * 3,
    [theme.breakpoints.up(400 + theme.spacing.unit * 3 * 2)]: {
      width: 400,
      marginLeft: 'auto',
      marginRight: 'auto',
    },
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
  paper: {
    marginTop: theme.spacing.unit * 8,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: `${theme.spacing.unit * 2}px ${theme.spacing.unit * 3}px ${theme.spacing.unit * 3}px`,
  },
  form: {
    width: '100%', // Fix IE 11 issue.
    marginTop: theme.spacing.unit,
  },
  avatar: {
   margin: theme.spacing.unit,
   backgroundColor: theme.palette.secondary.main,
 },
  background: {
    backgroundImage: `url(/img/NUH.jpg)`,
    backgroundSize: 'cover',
    minHeight: '100vh',
    backgroundPosition: 'center center'
  },
  overlay: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    minHeight: '100vh'
  },
  nuslogo: {
    maxHeight: '7vh',
    paddingRight: '1em',
  },
  nuhlogo: {
    maxHeight: '7vh'
  },
  toolbar: {
    paddingTop: '1em'
  }
});

const mapStateToProps = state => {
  return {
    authenticated: state.authenticated,
    autherror: state.autherror,
    isAuthenticating: state.isAuthenticating,
  };
};


const mapDispatchToProps = dispatch => {
  return {
    addUsername: username => dispatch(addUsername(username)),
    signInUser: credentials => dispatch(signInUser(credentials)),
    verifyAuth: credentials => dispatch(verifyAuth(credentials)),
  };
};

class Login extends Component {
  constructor(props) {
    super(props);

    this.state = {
      username: "",
      password: "",
      loading: false,
      query: 'idle',
      error: '',
      showPassword: false,
    };
  }
  componentWillUnmount() {
    clearTimeout(this.timer)
  }

  componentDidUpdate(prevProps, prevState) {
    if(this.props.authenticated) {
      this.props.history.push('/home');
    }
  }
  renderAuthenticationError = () => {
    if(this.props.autherror) {
      return <Typography variant="subtitle1" style={{color: 'red'}}> {this.props.autherror} </Typography>
    }
    return <div/>
  }
  handleSubmit = (e) => {
    e.preventDefault();
    clearTimeout(this.timer);
    const { username } = this.state;

    let credentials = {email: this.state.username, password: this.state.password }
    this.props.signInUser(credentials)
  }

  handleLoading = () => {
    this.setState(state => ({
      loading: !state.loading,
    }))
  }

  handleClickShowPassword = () => {
    this.setState(state => ({ showPassword: !state.showPassword }));
  };

  render() {

    const { classes } = this.props;

    return (
      <div className={classes.background}>
        <div className={classes.overlay}>
          <Toolbar className={classes.toolbar}>
            <img src={'img/nuslogo.png'} className={classes.nuslogo} />
            <img src={'img/nuhlogo.png'} className={classes.nuhlogo} />
          </Toolbar>
          <Grid container
            justify="center"
            direction="column"
            spacing={0}
            alignItems="center"
            style={{ minHeight: '75vh'}}>
            <Grid item xs={12}>
              <div className={classes.layout}>
                <Paper className={classes.paper} elevation={10}>
                  <Avatar className={classes.avatar}>
                    <LockIcon />
                  </Avatar>
                  <Typography variant="h5" gutterBottom>Login</Typography>
                  <Typography variant="subtitle1" gutterBottom>Medical Portal</Typography>
                  {this.renderAuthenticationError()}
                  <form className={classes.form} onSubmit={this.handleSubmit}>
                    <FormControl margin="normal" required fullWidth>
                      <TextField
                        label="Email"
                        placeholder="Email"
                        autoComplete="email"
                        required = {true}
                        variant="outlined"
                        fullWidth
                        className={classes.textField}
                        onChange = {(e) => this.setState({username:e.target.value})}
                      />
                    </FormControl>
                    <FormControl margin="normal" required fullWidth>
                      <TextField
                        type={this.state.showPassword ? 'text' : 'password'}
                        label="Password"
                        placeholder="Password"
                        required = {true}
                        variant="outlined"
                        className={classNames(classes.margin, classes.textField)}
                        onChange = {(e) => this.setState({password:e.target.value})}
                        InputProps={{
                          endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label="Toggle password visibility"
                              onClick={this.handleClickShowPassword}
                            >
                              {this.state.showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                    </FormControl>
                    <br/>
                    <div style={{ textAlign: 'center', paddingTop: '1rem'}}>
                      <Button type='submit' variant="contained" color="primary">
                        Submit
                      </Button>
                    </div>
                  </form>
                </Paper>
              </div>
            </Grid>
          </Grid>
        </div>
      </div>
    )
  }
}

const ConnectedLogin = connect(mapStateToProps, mapDispatchToProps)(Login);

export default withStyles(styles)(ConnectedLogin);
